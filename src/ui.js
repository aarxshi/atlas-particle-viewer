import { ParticleTracks } from './particle-tracks.js';

/**
 * UI Manager - Handles all user interface interactions, tooltips, and controls
 */
export class UIManager {
  constructor(dataLoader, particleTracks, detector) {
    this.dataLoader = dataLoader;
    this.particleTracks = particleTracks;
    this.detector = detector;
    
    // UI state
    this.currentFilters = {
      types: [],
      minEnergy: 0,
      maxEnergy: Infinity,
      minPt: 0,
      maxPt: Infinity
    };
    
    // Tooltip state
    this.tooltip = null;
    this.selectedParticleInfo = null;
    
    this.init();
    this.setupEventListeners();
  }

  /**
   * Initialize UI components
   */
  init() {
    this.createUIOverlay();
    this.createTooltip();
    this.createLegend();
    this.createPerformanceMonitor();
    this.populateEventSelector();
  }

  /**
   * Create main UI overlay
   */
  createUIOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'ui-overlay';
    overlay.innerHTML = `
      <div class="ui-panel">
        <div class="panel-header">
          <h2>ATLAS Particle Viewer</h2>
          <div class="panel-controls">
            <button id="toggle-ui" title="Toggle UI (U)">⚙️</button>
            <button id="help-btn" title="Help">❓</button>
          </div>
        </div>
        
        <div class="panel-content">
          <!-- Event Controls -->
          <div class="control-section">
            <h3>Event</h3>
            <div class="event-controls">
              <select id="event-selector">
                <option value="">Select Event...</option>
              </select>
              <div class="event-nav">
                <button id="prev-event" title="Previous Event">⮜</button>
                <span id="event-counter">0/0</span>
                <button id="next-event" title="Next Event">⮞</button>
              </div>
            </div>
            <div class="file-upload">
              <input type="file" id="file-input" accept=".json,.csv" />
              <label for="file-input">Upload Event Data</label>
            </div>
          </div>

          <!-- Animation Controls -->
          <div class="control-section">
            <h3>Animation</h3>
            <div class="animation-controls">
              <button id="play-pause" title="Play/Pause (Space)">⏸️</button>
              <button id="reset-animation" title="Reset Animation">🔄</button>
              <div class="animation-speed">
                <label>Speed:</label>
                <input type="range" id="speed-slider" min="0.1" max="3" step="0.1" value="1" />
                <span id="speed-value">1x</span>
              </div>
            </div>
          </div>

          <!-- Particle Filters -->
          <div class="control-section">
            <h3>Particle Filters</h3>
            <div class="filter-controls">
              <div class="particle-types">
                <h4>Types</h4>
                <div id="particle-type-filters" class="checkbox-grid">
                  <!-- Dynamically populated -->
                </div>
              </div>
              
              <div class="energy-filters">
                <h4>Energy (GeV)</h4>
                <div class="range-control">
                  <label>Min:</label>
                  <input type="number" id="min-energy" value="0" min="0" step="1" />
                </div>
                <div class="range-control">
                  <label>Max:</label>
                  <input type="number" id="max-energy" value="1000" min="0" step="1" />
                </div>
              </div>
              
              <div class="pt-filters">
                <h4>Transverse Momentum (GeV/c)</h4>
                <div class="range-control">
                  <label>Min:</label>
                  <input type="number" id="min-pt" value="0" min="0" step="0.1" />
                </div>
                <div class="range-control">
                  <label>Max:</label>
                  <input type="number" id="max-pt" value="1000" min="0" step="0.1" />
                </div>
              </div>
            </div>
          </div>

          <!-- Detector Controls -->
          <div class="control-section">
            <h3>Detector Layers</h3>
            <div id="detector-layer-controls" class="checkbox-grid">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Statistics -->
          <div class="control-section">
            <h3>Event Statistics</h3>
            <div id="event-stats" class="stats-display">
              <div class="stat-item">
                <span class="stat-label">Total Particles:</span>
                <span class="stat-value" id="total-particles">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Visible Tracks:</span>
                <span class="stat-value" id="visible-tracks">0</span>
              </div>
              <div id="particle-type-stats" class="particle-stats">
                <!-- Dynamically populated -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Create collapsible panel behavior
    const header = overlay.querySelector('.panel-header');
    const content = overlay.querySelector('.panel-content');
    let isCollapsed = false;
    
    header.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // Don't collapse when clicking buttons
      
      isCollapsed = !isCollapsed;
      content.style.display = isCollapsed ? 'none' : 'block';
      overlay.classList.toggle('collapsed', isCollapsed);
    });
  }

  /**
   * Create tooltip for particle information
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'particle-tooltip';
    this.tooltip.style.display = 'none';
    document.body.appendChild(this.tooltip);

    // Create detailed particle info panel
    this.selectedParticleInfo = document.createElement('div');
    this.selectedParticleInfo.className = 'particle-info-panel';
    this.selectedParticleInfo.style.display = 'none';
    this.selectedParticleInfo.innerHTML = `
      <div class="info-header">
        <h3>Particle Information</h3>
        <button id="close-particle-info" title="Close">✕</button>
      </div>
      <div class="info-content" id="particle-info-content">
        <!-- Dynamically populated -->
      </div>
    `;
    document.body.appendChild(this.selectedParticleInfo);
  }

  /**
   * Create particle legend
   */
  createLegend() {
    const legend = document.createElement('div');
    legend.className = 'particle-legend';
    legend.innerHTML = '<h4>Particle Legend</h4><div class="legend-items"></div>';
    
    const legendItems = legend.querySelector('.legend-items');
    const particleConfig = ParticleTracks.getParticleConfig();
    
    Object.entries(particleConfig).forEach(([type, config]) => {
      if (type === 'unknown') return; // Skip unknown type in legend
      
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <div class="legend-color" style="background-color: #${config.color.toString(16).padStart(6, '0')}"></div>
        <span class="legend-symbol">${config.symbol}</span>
        <span class="legend-name">${config.name}</span>
      `;
      legendItems.appendChild(item);
    });
    
    document.body.appendChild(legend);
  }

  /**
   * Create performance monitor
   */
  createPerformanceMonitor() {
    const monitor = document.createElement('div');
    monitor.className = 'performance-monitor';
    monitor.innerHTML = `
      <div class="perf-item">FPS: <span id="fps-display">60</span></div>
      <div class="perf-item">Particles: <span id="particle-count">0</span></div>
      <div class="perf-item">Visible: <span id="visible-count">0</span></div>
    `;
    document.body.appendChild(monitor);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Event selector
    document.getElementById('event-selector').addEventListener('change', (e) => {
      const eventIndex = parseInt(e.target.value);
      if (!isNaN(eventIndex)) {
        this.switchToEvent(eventIndex);
      }
    });

    // Event navigation
    document.getElementById('prev-event').addEventListener('click', () => {
      this.previousEvent();
    });
    
    document.getElementById('next-event').addEventListener('click', () => {
      this.nextEvent();
    });

    // File upload
    document.getElementById('file-input').addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0]);
    });

    // Animation controls
    document.getElementById('play-pause').addEventListener('click', () => {
      this.toggleAnimation();
    });
    
    document.getElementById('reset-animation').addEventListener('click', () => {
      this.resetAnimation();
    });
    
    document.getElementById('speed-slider').addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      document.getElementById('speed-value').textContent = speed + 'x';
      // TODO: Implement animation speed control
    });

    // Filter controls
    document.getElementById('min-energy').addEventListener('input', () => this.updateFilters());
    document.getElementById('max-energy').addEventListener('input', () => this.updateFilters());
    document.getElementById('min-pt').addEventListener('input', () => this.updateFilters());
    document.getElementById('max-pt').addEventListener('input', () => this.updateFilters());

    // UI toggle
    document.getElementById('toggle-ui').addEventListener('click', () => {
      const overlay = document.querySelector('.ui-overlay');
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    });

    // Help button
    document.getElementById('help-btn').addEventListener('click', () => {
      this.showHelpModal();
    });

    // Close particle info
    document.getElementById('close-particle-info').addEventListener('click', () => {
      this.hideParticleInfo();
    });

    // Particle interaction events
    window.addEventListener('particleHover', (e) => this.handleParticleHover(e));
    window.addEventListener('particleHoverEnd', () => this.hideTooltip());
    window.addEventListener('particleSelect', (e) => this.handleParticleSelect(e));
    window.addEventListener('particleDeselect', () => this.hideParticleInfo());

    // Performance monitoring
    window.addEventListener('fpsUpdate', (e) => {
      document.getElementById('fps-display').textContent = e.detail.fps;
    });

    // Animation events
    window.addEventListener('animationToggle', (e) => {
      const playPauseBtn = document.getElementById('play-pause');
      playPauseBtn.textContent = e.detail.isPlaying ? '⏸️' : '▶️';
    });
  }

  /**
   * Populate event selector dropdown
   */
  populateEventSelector() {
    const selector = document.getElementById('event-selector');
    selector.innerHTML = '<option value="">Select Event...</option>';
    
    const events = this.dataLoader.getEvents();
    events.forEach((event, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${event.event_id} (${event.particles.length} particles)`;
      selector.appendChild(option);
    });
    
    this.updateEventCounter();
  }

  /**
   * Populate particle type filters
   */
  populateParticleTypeFilters() {
    const container = document.getElementById('particle-type-filters');
    container.innerHTML = '';
    
    const currentEvent = this.dataLoader.getCurrentEvent();
    if (!currentEvent) return;
    
    // Get unique particle types in current event
    const particleTypes = [...new Set(currentEvent.particles.map(p => p.type))];
    const particleConfig = ParticleTracks.getParticleConfig();
    
    particleTypes.forEach(type => {
      const config = particleConfig[type] || particleConfig.unknown;
      
      const checkbox = document.createElement('div');
      checkbox.className = 'particle-type-filter';
      checkbox.innerHTML = `
        <input type="checkbox" id="filter-${type}" value="${type}" checked />
        <label for="filter-${type}">
          <span class="type-color" style="background-color: #${config.color.toString(16).padStart(6, '0')}"></span>
          ${config.symbol} ${config.name}
        </label>
      `;
      
      const input = checkbox.querySelector('input');
      input.addEventListener('change', () => this.updateFilters());
      
      container.appendChild(checkbox);
    });
  }

  /**
   * Populate detector layer controls
   */
  populateDetectorLayerControls() {
    const container = document.getElementById('detector-layer-controls');
    container.innerHTML = '';
    
    const layerNames = this.detector.getLayerNames();
    const layerLabels = {
      innerTracker: 'Inner Tracker',
      emCalorimeter: 'EM Calorimeter',
      hadCalorimeter: 'Hadronic Calorimeter',
      muonSystem: 'Muon System',
      support: 'Support Structure'
    };
    
    layerNames.forEach(layerName => {
      const checkbox = document.createElement('div');
      checkbox.className = 'detector-layer-filter';
      checkbox.innerHTML = `
        <input type="checkbox" id="layer-${layerName}" value="${layerName}" checked />
        <label for="layer-${layerName}">${layerLabels[layerName] || layerName}</label>
      `;
      
      const input = checkbox.querySelector('input');
      input.addEventListener('change', (e) => {
        this.detector.setLayerVisibility(layerName, e.target.checked);
      });
      
      container.appendChild(checkbox);
    });
  }

  /**
   * Update particle filters
   */
  updateFilters() {
    const typeCheckboxes = document.querySelectorAll('#particle-type-filters input[type="checkbox"]');
    const selectedTypes = Array.from(typeCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    
    const minEnergy = parseFloat(document.getElementById('min-energy').value) || 0;
    const maxEnergy = parseFloat(document.getElementById('max-energy').value) || Infinity;
    const minPt = parseFloat(document.getElementById('min-pt').value) || 0;
    const maxPt = parseFloat(document.getElementById('max-pt').value) || Infinity;
    
    this.currentFilters = {
      types: selectedTypes,
      minEnergy: minEnergy,
      maxEnergy: maxEnergy,
      minPt: minPt,
      maxPt: maxPt
    };
    
    // Apply filters to particle tracks
    this.particleTracks.filterByType(selectedTypes);
    this.particleTracks.filterByEnergy(minEnergy, maxEnergy);
    this.particleTracks.filterByPt(minPt, maxPt);
    
    // Update statistics
    this.updateStatistics();
  }

  /**
   * Update event statistics display
   */
  updateStatistics() {
    const currentEvent = this.dataLoader.getCurrentEvent();
    if (!currentEvent) return;
    
    const totalParticles = currentEvent.particles.length;
    const visibleTracks = this.particleTracks.getVisibleTrackCount();
    const stats = this.dataLoader.getParticleStatistics();
    
    document.getElementById('total-particles').textContent = totalParticles;
    document.getElementById('visible-tracks').textContent = visibleTracks;
    document.getElementById('particle-count').textContent = totalParticles;
    document.getElementById('visible-count').textContent = visibleTracks;
    
    // Update particle type statistics
    const statsContainer = document.getElementById('particle-type-stats');
    statsContainer.innerHTML = '';
    
    Object.entries(stats).forEach(([type, stat]) => {
      const config = ParticleTracks.getParticleConfig()[type];
      const statItem = document.createElement('div');
      statItem.className = 'particle-stat-item';
      statItem.innerHTML = `
        <span class="stat-type" style="color: #${config.color.toString(16).padStart(6, '0')}">${config.symbol}</span>
        <span class="stat-count">${stat.count}</span>
        <span class="stat-energy">⚡${stat.averageEnergy.toFixed(1)} GeV</span>
      `;
      statsContainer.appendChild(statItem);
    });
  }

  /**
   * Switch to event by index
   */
  switchToEvent(index) {
    const event = this.dataLoader.switchToEvent(index);
    if (event) {
      this.loadEventData(event);
      this.updateEventSelector();
    }
  }

  /**
   * Go to next event
   */
  nextEvent() {
    const event = this.dataLoader.nextEvent();
    if (event) {
      this.loadEventData(event);
      this.updateEventSelector();
    }
  }

  /**
   * Go to previous event
   */
  previousEvent() {
    const event = this.dataLoader.previousEvent();
    if (event) {
      this.loadEventData(event);
      this.updateEventSelector();
    }
  }

  /**
   * Load event data into visualization
   */
  loadEventData(event) {
    // Update detector vertex position
    this.detector.setVertexPosition(event.vertex.x, event.vertex.y, event.vertex.z);
    
    // Load particle tracks
    this.particleTracks.loadTracks(event.particles, event.vertex);
    
    // Update UI components
    this.populateParticleTypeFilters();
    this.updateStatistics();
    
    // Reset filters to show all particles initially
    this.resetFilters();
  }

  /**
   * Update event selector and counter
   */
  updateEventSelector() {
    const selector = document.getElementById('event-selector');
    const currentIndex = this.dataLoader.getCurrentEventIndex();
    
    selector.value = currentIndex;
    this.updateEventCounter();
  }

  /**
   * Update event counter display
   */
  updateEventCounter() {
    const counter = document.getElementById('event-counter');
    const currentIndex = this.dataLoader.getCurrentEventIndex();
    const totalEvents = this.dataLoader.getEventCount();
    
    counter.textContent = `${currentIndex + 1}/${totalEvents}`;
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(file) {
    if (!file) return;
    
    try {
      let event;
      if (file.name.endsWith('.json')) {
        event = await this.dataLoader.loadFromFile(file);
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        event = this.dataLoader.parseCSV(text);
      } else {
        throw new Error('Unsupported file format');
      }
      
      // Add to events list
      this.dataLoader.events.push(event);
      this.dataLoader.switchToEvent(this.dataLoader.events.length - 1);
      
      // Update UI
      this.populateEventSelector();
      this.loadEventData(event);
      
      this.showNotification('Event loaded successfully!', 'success');
      
    } catch (error) {
      console.error('File upload error:', error);
      this.showNotification('Error loading file: ' + error.message, 'error');
    }
  }

  /**
   * Handle particle hover
   */
  handleParticleHover(event) {
    const { particle, position } = event.detail;
    this.showTooltip(particle, position);
  }

  /**
   * Show particle tooltip
   */
  showTooltip(particle, mousePosition) {
    if (!this.tooltip) return;
    
    const config = ParticleTracks.getParticleConfig()[particle.type] || ParticleTracks.getParticleConfig().unknown;
    const pt = particle.derived?.pt || Math.sqrt(particle.px * particle.px + particle.py * particle.py);
    
    this.tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="particle-symbol" style="color: #${config.color.toString(16).padStart(6, '0')}">${config.symbol}</span>
        <span class="particle-name">${config.name}</span>
      </div>
      <div class="tooltip-content">
        <div>ID: ${particle.id}</div>
        <div>Energy: ${particle.E.toFixed(2)} GeV</div>
        <div>pₜ: ${pt.toFixed(2)} GeV/c</div>
        <div>Charge: ${particle.charge || 0}</div>
      </div>
    `;
    
    // Position tooltip near cursor but keep it on screen
    const rect = document.body.getBoundingClientRect();
    const x = (mousePosition.x + 1) * rect.width * 0.5 + 10;
    const y = (-mousePosition.y + 1) * rect.height * 0.5 + 10;
    
    this.tooltip.style.left = Math.min(x, window.innerWidth - 200) + 'px';
    this.tooltip.style.top = Math.min(y, window.innerHeight - 100) + 'px';
    this.tooltip.style.display = 'block';
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  /**
   * Handle particle selection
   */
  handleParticleSelect(event) {
    const { particle, screenPosition } = event.detail;
    this.showParticleInfo(particle, screenPosition);
  }

  /**
   * Show detailed particle information panel
   */
  showParticleInfo(particle, screenPosition) {
    if (!this.selectedParticleInfo) return;
    
    const config = ParticleTracks.getParticleConfig()[particle.type] || ParticleTracks.getParticleConfig().unknown;
    const derived = particle.derived || {};
    
    const content = document.getElementById('particle-info-content');
    content.innerHTML = `
      <div class="particle-header">
        <span class="particle-symbol large" style="color: #${config.color.toString(16).padStart(6, '0')}">${config.symbol}</span>
        <div class="particle-title">
          <h4>${config.name}</h4>
          <span class="particle-id">ID: ${particle.id}</span>
        </div>
      </div>
      
      <div class="info-section">
        <h5>Kinematics</h5>
        <div class="info-grid">
          <div class="info-item">
            <label>Energy (E):</label>
            <value>${particle.E.toFixed(3)} GeV</value>
          </div>
          <div class="info-item">
            <label>pₓ:</label>
            <value>${particle.px.toFixed(3)} GeV/c</value>
          </div>
          <div class="info-item">
            <label>pᵧ:</label>
            <value>${particle.py.toFixed(3)} GeV/c</value>
          </div>
          <div class="info-item">
            <label>pᵤ:</label>
            <value>${particle.pz.toFixed(3)} GeV/c</value>
          </div>
          <div class="info-item">
            <label>pₜ:</label>
            <value>${derived.pt?.toFixed(3) || 'N/A'} GeV/c</value>
          </div>
          <div class="info-item">
            <label>|p|:</label>
            <value>${derived.momentum?.toFixed(3) || 'N/A'} GeV/c</value>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h5>Properties</h5>
        <div class="info-grid">
          <div class="info-item">
            <label>Charge:</label>
            <value>${particle.charge || 0} e</value>
          </div>
          <div class="info-item">
            <label>PDG ID:</label>
            <value>${particle.pdg || 'N/A'}</value>
          </div>
          <div class="info-item">
            <label>η (pseudorapidity):</label>
            <value>${derived.eta?.toFixed(3) || 'N/A'}</value>
          </div>
          <div class="info-item">
            <label>φ (azimuth):</label>
            <value>${derived.phi?.toFixed(3) || 'N/A'} rad</value>
          </div>
        </div>
      </div>
      
      ${particle.calo_hits ? this.renderCalorimeterHits(particle.calo_hits) : ''}
    `;
    
    // Position panel
    const x = Math.min(screenPosition.x + 20, window.innerWidth - 350);
    const y = Math.min(screenPosition.y + 20, window.innerHeight - 400);
    
    this.selectedParticleInfo.style.left = x + 'px';
    this.selectedParticleInfo.style.top = y + 'px';
    this.selectedParticleInfo.style.display = 'block';
  }

  /**
   * Render calorimeter hits information
   */
  renderCalorimeterHits(caloHits) {
    if (!caloHits || caloHits.length === 0) return '';
    
    const hitsHtml = caloHits.map(hit => `
      <div class="calo-hit">
        <span class="hit-layer">${hit.layer}:</span>
        <span class="hit-energy">${hit.energy.toFixed(2)} GeV</span>
        <span class="hit-position">(η=${hit.eta?.toFixed(2)}, φ=${hit.phi?.toFixed(2)})</span>
      </div>
    `).join('');
    
    return `
      <div class="info-section">
        <h5>Calorimeter Hits</h5>
        <div class="calo-hits">
          ${hitsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Hide particle information panel
   */
  hideParticleInfo() {
    if (this.selectedParticleInfo) {
      this.selectedParticleInfo.style.display = 'none';
    }
  }

  /**
   * Toggle animation play/pause
   */
  toggleAnimation() {
    // This will trigger the keyboard event handler in ThreeScene
    const spaceEvent = new KeyboardEvent('keydown', { code: 'Space' });
    window.dispatchEvent(spaceEvent);
  }

  /**
   * Reset animation
   */
  resetAnimation() {
    const currentEvent = this.dataLoader.getCurrentEvent();
    if (currentEvent) {
      this.particleTracks.loadTracks(currentEvent.particles, currentEvent.vertex);
    }
  }

  /**
   * Reset filters to show all particles
   */
  resetFilters() {
    // Check all particle type filters
    const typeCheckboxes = document.querySelectorAll('#particle-type-filters input[type="checkbox"]');
    typeCheckboxes.forEach(cb => cb.checked = true);
    
    // Reset energy and pt filters
    document.getElementById('min-energy').value = '0';
    document.getElementById('max-energy').value = '1000';
    document.getElementById('min-pt').value = '0';
    document.getElementById('max-pt').value = '1000';
    
    this.updateFilters();
  }

  /**
   * Show help modal
   */
  showHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'help-modal';
    modal.innerHTML = `
      <div class="help-content">
        <div class="help-header">
          <h3>ATLAS Particle Viewer Help</h3>
          <button class="close-help">✕</button>
        </div>
        <div class="help-body">
          <section>
            <h4>Controls</h4>
            <ul>
              <li><strong>Mouse:</strong> Orbit camera around detector</li>
              <li><strong>Scroll:</strong> Zoom in/out</li>
              <li><strong>Click particle track:</strong> Show detailed information</li>
              <li><strong>Hover particle track:</strong> Quick info tooltip</li>
            </ul>
          </section>
          
          <section>
            <h4>Keyboard Shortcuts</h4>
            <ul>
              <li><strong>R:</strong> Reset camera view</li>
              <li><strong>U:</strong> Toggle UI visibility</li>
              <li><strong>Space:</strong> Play/pause animation</li>
              <li><strong>A:</strong> Toggle coordinate axes</li>
            </ul>
          </section>
          
          <section>
            <h4>Particle Legend</h4>
            <p>Different particle types are color-coded. See the legend panel for details.</p>
          </section>
          
          <section>
            <h4>Data Format</h4>
            <p>Upload your own ATLAS data in JSON format. See README for schema details.</p>
          </section>
        </div>
      </div>
    `;
    
    modal.querySelector('.close-help').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    document.body.appendChild(modal);
  }

  /**
   * Show notification message
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Initialize with sample data
   */
  async initWithSampleData() {
    try {
      await this.dataLoader.loadSampleEvents();
      this.populateEventSelector();
      this.populateDetectorLayerControls();
      
      const firstEvent = this.dataLoader.getCurrentEvent();
      if (firstEvent) {
        this.loadEventData(firstEvent);
      }
      
    } catch (error) {
      console.error('Error loading sample data:', error);
      this.showNotification('Error loading sample data', 'error');
    }
  }
}