import * as THREE from 'three';

/**
 * Particle type configuration with colors and properties
 */
const PARTICLE_CONFIG = {
  electron: { color: 0x00FF00, name: 'Electron', symbol: 'e⁻', thickness: 2.5 },
  positron: { color: 0x00FF88, name: 'Positron', symbol: 'e⁺', thickness: 2.5 },
  muon: { color: 0xFF0000, name: 'Muon', symbol: 'μ', thickness: 3.0 },
  photon: { color: 0xFFFF00, name: 'Photon', symbol: 'γ', thickness: 2.0 },
  pion_plus: { color: 0x0080FF, name: 'Pion+', symbol: 'π⁺', thickness: 2.0 },
  pion_minus: { color: 0x8000FF, name: 'Pion-', symbol: 'π⁻', thickness: 2.0 },
  kaon_plus: { color: 0xFF8000, name: 'Kaon+', symbol: 'K⁺', thickness: 2.0 },
  kaon_minus: { color: 0xFF4000, name: 'Kaon-', symbol: 'K⁻', thickness: 2.0 },
  proton: { color: 0xFF0080, name: 'Proton', symbol: 'p', thickness: 2.5 },
  neutron: { color: 0x808080, name: 'Neutron', symbol: 'n', thickness: 2.0 },
  // Default for unknown particles
  unknown: { color: 0xCCCCCC, name: 'Unknown', symbol: '?', thickness: 1.5 }
};

/**
 * ParticleTracks - Manages particle track rendering and animation
 * Handles efficient GPU-based rendering with color coding and interactivity
 */
export class ParticleTracks {
  constructor(scene) {
    this.scene = scene;
    this.tracks = [];
    this.trackObjects = [];
    this.animatedTracks = [];
    this.hoveredTrack = null;
    this.selectedTrack = null;
    
    // Performance settings
    this.maxTracks = 500; // Performance limit
    this.useSimplifiedRendering = false;
    
    // Animation state
    this.animationProgress = 0;
    this.animationDuration = 2000; // milliseconds
    this.isAnimating = false;
    this.animationStartTime = 0;
    
    // Group for organizing tracks
    this.tracksGroup = new THREE.Group();
    this.tracksGroup.name = 'particleTracks';
    this.scene.add(this.tracksGroup);
    
    // Interaction setup
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for interaction
   */
  setupEventListeners() {
    window.addEventListener('sceneMouseMove', (event) => this.handleMouseMove(event));
    window.addEventListener('sceneClick', (event) => this.handleClick(event));
    window.addEventListener('animationToggle', (event) => this.handleAnimationToggle(event));
  }

  /**
   * Load and render tracks from particle data
   */
  loadTracks(particles, vertex = { x: 0, y: 0, z: 0 }) {
    // Clear existing tracks
    this.clearTracks();
    
    // Check performance limits
    if (particles.length > this.maxTracks) {
      console.warn(`Performance warning: ${particles.length} particles exceed limit of ${this.maxTracks}`);
      this.useSimplifiedRendering = true;
    } else {
      this.useSimplifiedRendering = false;
    }
    
    // Create tracks for each particle
    particles.forEach((particle, index) => {
      this.createParticleTrack(particle, vertex, index);
    });
    
    // Start animation if enabled
    this.startAnimation();
  }

  /**
   * Create a single particle track
   */
  createParticleTrack(particle, vertex, index) {
    const config = PARTICLE_CONFIG[particle.type] || PARTICLE_CONFIG.unknown;
    const trajectory = particle.trajectory || [];
    
    if (trajectory.length < 2) {
      console.warn(`Particle ${particle.id} has insufficient trajectory data`);
      return;
    }
    
    // Calculate physics properties
    const pt = Math.sqrt(particle.px * particle.px + particle.py * particle.py);
    const momentum = Math.sqrt(particle.px * particle.px + particle.py * particle.py + particle.pz * particle.pz);
    
    // Create track data
    const trackData = {
      particle: particle,
      config: config,
      trajectory: trajectory,
      pt: pt,
      momentum: momentum,
      index: index
    };
    
    this.tracks.push(trackData);
    
    // Create visual representation
    if (this.useSimplifiedRendering && trajectory.length > 10) {
      this.createSimplifiedTrack(trackData);
    } else {
      this.createDetailedTrack(trackData);
    }
  }

  /**
   * Create detailed track with full geometry
   */
  createDetailedTrack(trackData) {
    const { particle, config, trajectory, pt, momentum } = trackData;
    
    // Create points for the track line
    const points = trajectory.map(point => 
      new THREE.Vector3(point.x, point.y, point.z)
    );
    
    // Calculate line thickness based on momentum
    const baseThickness = config.thickness;
    const momentumFactor = Math.min(momentum / 50, 2); // Normalize momentum
    const thickness = baseThickness * (0.5 + momentumFactor * 0.5);
    
    // Create tube geometry for thickness
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const tubeGeometry = new THREE.TubeGeometry(curve, points.length * 2, thickness * 0.01, 8, false);
    
    // Create material with energy-based opacity
    const energyAlpha = Math.min(particle.E / 100, 1) * 0.7 + 0.3;
    const trackMaterial = new THREE.MeshLambertMaterial({
      color: config.color,
      transparent: true,
      opacity: energyAlpha,
      side: THREE.DoubleSide
    });
    
    const trackMesh = new THREE.Mesh(tubeGeometry, trackMaterial);
    trackMesh.userData = {
      particle: particle,
      trackData: trackData,
      originalColor: config.color,
      originalOpacity: energyAlpha
    };
    
    // Add to animated tracks for emergence animation
    this.animatedTracks.push({
      mesh: trackMesh,
      originalScale: 1,
      delay: Math.random() * 500 // Random delay for staggered animation
    });
    
    this.trackObjects.push(trackMesh);
    this.tracksGroup.add(trackMesh);
    
    // Add particle direction arrow
    this.createDirectionArrow(trackData, points);
  }

  /**
   * Create simplified track for performance
   */
  createSimplifiedTrack(trackData) {
    const { particle, config, trajectory } = trackData;
    
    // Reduce number of points for performance
    const simplifiedPoints = [];
    const step = Math.max(1, Math.floor(trajectory.length / 8));
    
    for (let i = 0; i < trajectory.length; i += step) {
      const point = trajectory[i];
      simplifiedPoints.push(new THREE.Vector3(point.x, point.y, point.z));
    }
    
    // Add final point
    if (simplifiedPoints.length > 0) {
      const lastPoint = trajectory[trajectory.length - 1];
      simplifiedPoints.push(new THREE.Vector3(lastPoint.x, lastPoint.y, lastPoint.z));
    }
    
    // Create simple line geometry
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(simplifiedPoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.8,
      linewidth: 2 // Note: linewidth may not work in all WebGL contexts
    });
    
    const trackLine = new THREE.Line(lineGeometry, lineMaterial);
    trackLine.userData = {
      particle: particle,
      trackData: trackData,
      originalColor: config.color,
      originalOpacity: 0.8
    };
    
    this.trackObjects.push(trackLine);
    this.tracksGroup.add(trackLine);
  }

  /**
   * Create direction arrow for particle momentum
   */
  createDirectionArrow(trackData, points) {
    if (points.length < 2) return;
    
    const { particle, config } = trackData;
    
    // Calculate arrow position (at the end of track)
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
    
    // Create arrow geometry
    const arrowGeometry = new THREE.ConeGeometry(0.02, 0.1, 8);
    const arrowMaterial = new THREE.MeshLambertMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.9
    });
    
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.copy(endPoint);
    
    // Orient arrow in direction of momentum
    arrow.lookAt(endPoint.clone().add(direction));
    arrow.rotateX(Math.PI / 2); // Correct orientation
    
    arrow.userData = {
      particle: particle,
      trackData: trackData,
      isArrow: true
    };
    
    this.trackObjects.push(arrow);
    this.tracksGroup.add(arrow);
  }

  /**
   * Start track emergence animation
   */
  startAnimation() {
    if (this.animatedTracks.length === 0) return;
    
    this.isAnimating = true;
    this.animationStartTime = performance.now();
    this.animationProgress = 0;
    
    // Initially hide all tracks
    this.animatedTracks.forEach(track => {
      track.mesh.scale.setScalar(0);
    });
    
    this.animateFrame();
  }

  /**
   * Animation frame update
   */
  animateFrame() {
    if (!this.isAnimating) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - this.animationStartTime;
    this.animationProgress = Math.min(elapsed / this.animationDuration, 1);
    
    // Update track scales with staggered timing
    this.animatedTracks.forEach(track => {
      const adjustedProgress = Math.max(0, (elapsed - track.delay) / this.animationDuration);
      const scale = Math.min(adjustedProgress, 1);
      
      // Smooth easing
      const easedScale = this.easeOutCubic(scale);
      track.mesh.scale.setScalar(easedScale);
    });
    
    if (this.animationProgress < 1) {
      requestAnimationFrame(() => this.animateFrame());
    } else {
      this.isAnimating = false;
      // Emit animation complete event
      window.dispatchEvent(new CustomEvent('trackAnimationComplete'));
    }
  }

  /**
   * Cubic ease-out function for smooth animation
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Handle mouse movement for track highlighting
   */
  handleMouseMove(event) {
    const { mouse, raycaster, camera, scene } = event.detail;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(this.trackObjects);
    
    // Clear previous hover state
    if (this.hoveredTrack && this.hoveredTrack !== this.selectedTrack) {
      this.resetTrackAppearance(this.hoveredTrack);
    }
    
    if (intersects.length > 0) {
      const intersectedTrack = intersects[0].object;
      this.hoveredTrack = intersectedTrack;
      this.highlightTrack(intersectedTrack);
      
      // Change cursor
      document.body.style.cursor = 'pointer';
      
      // Emit hover event with particle data
      const particle = intersectedTrack.userData.particle;
      window.dispatchEvent(new CustomEvent('particleHover', { 
        detail: { particle, position: mouse } 
      }));
    } else {
      this.hoveredTrack = null;
      document.body.style.cursor = 'default';
      window.dispatchEvent(new CustomEvent('particleHoverEnd'));
    }
  }

  /**
   * Handle click for track selection
   */
  handleClick(event) {
    const { mouse, raycaster, camera, scene, clientX, clientY } = event.detail;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(this.trackObjects);
    
    // Clear previous selection
    if (this.selectedTrack) {
      this.resetTrackAppearance(this.selectedTrack);
    }
    
    if (intersects.length > 0) {
      const intersectedTrack = intersects[0].object;
      this.selectedTrack = intersectedTrack;
      this.highlightTrack(intersectedTrack, true);
      
      // Emit selection event with particle data and screen position
      const particle = intersectedTrack.userData.particle;
      window.dispatchEvent(new CustomEvent('particleSelect', { 
        detail: { 
          particle, 
          screenPosition: { x: clientX, y: clientY },
          worldPosition: intersects[0].point
        } 
      }));
    } else {
      this.selectedTrack = null;
      window.dispatchEvent(new CustomEvent('particleDeselect'));
    }
  }

  /**
   * Highlight a track
   */
  highlightTrack(trackMesh, isSelected = false) {
    const material = trackMesh.material;
    if (!material) return;
    
    if (isSelected) {
      material.color.setHex(0xFFFFFF); // White for selection
      material.opacity = 1.0;
      material.emissive.setHex(0x333333);
    } else {
      material.color.setHex(0xFFFFFF); // Lighter for hover
      material.opacity = Math.min(trackMesh.userData.originalOpacity + 0.3, 1.0);
    }
  }

  /**
   * Reset track appearance to original
   */
  resetTrackAppearance(trackMesh) {
    const material = trackMesh.material;
    if (!material || !trackMesh.userData) return;
    
    material.color.setHex(trackMesh.userData.originalColor);
    material.opacity = trackMesh.userData.originalOpacity;
    material.emissive.setHex(0x000000);
  }

  /**
   * Handle animation toggle
   */
  handleAnimationToggle(event) {
    const { isPlaying } = event.detail;
    if (isPlaying && !this.isAnimating) {
      this.startAnimation();
    }
  }

  /**
   * Filter tracks by particle type
   */
  filterByType(particleTypes) {
    this.trackObjects.forEach(trackObj => {
      const particle = trackObj.userData.particle;
      if (particle) {
        const isVisible = particleTypes.length === 0 || particleTypes.includes(particle.type);
        trackObj.visible = isVisible;
      }
    });
  }

  /**
   * Filter tracks by energy threshold
   */
  filterByEnergy(minEnergy, maxEnergy = Infinity) {
    this.trackObjects.forEach(trackObj => {
      const particle = trackObj.userData.particle;
      if (particle) {
        const isVisible = particle.E >= minEnergy && particle.E <= maxEnergy;
        trackObj.visible = trackObj.visible && isVisible; // Combine with type filter
      }
    });
  }

  /**
   * Filter tracks by transverse momentum threshold
   */
  filterByPt(minPt, maxPt = Infinity) {
    this.trackObjects.forEach(trackObj => {
      const trackData = trackObj.userData.trackData;
      if (trackData) {
        const isVisible = trackData.pt >= minPt && trackData.pt <= maxPt;
        trackObj.visible = trackObj.visible && isVisible;
      }
    });
  }

  /**
   * Get particle configuration for legend
   */
  static getParticleConfig() {
    return PARTICLE_CONFIG;
  }

  /**
   * Get track count
   */
  getTrackCount() {
    return this.tracks.length;
  }

  /**
   * Get visible track count
   */
  getVisibleTrackCount() {
    return this.trackObjects.filter(track => track.visible).length;
  }

  /**
   * Clear all tracks
   */
  clearTracks() {
    // Clear arrays
    this.tracks = [];
    this.animatedTracks = [];
    this.hoveredTrack = null;
    this.selectedTrack = null;
    
    // Remove all track objects from scene
    while (this.tracksGroup.children.length > 0) {
      const child = this.tracksGroup.children[0];
      this.tracksGroup.remove(child);
      
      // Dispose geometry and material
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    
    this.trackObjects = [];
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.clearTracks();
    this.scene.remove(this.tracksGroup);
    
    // Remove event listeners
    window.removeEventListener('sceneMouseMove', this.handleMouseMove);
    window.removeEventListener('sceneClick', this.handleClick);
    window.removeEventListener('animationToggle', this.handleAnimationToggle);
  }
}