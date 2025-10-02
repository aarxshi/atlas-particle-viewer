import { ThreeScene } from './three-scene.js';
import { DetectorGeometry } from './detector-geometry.js';
import { ParticleTracks } from './particle-tracks.js';
import { DataLoader } from './data-loader.js';
import { UIManager } from './ui.js';

/**
 * ATLAS Particle Viewer - Main Application
 * Browser-based 3D visualization of CERN ATLAS collision events
 * 
 * This application demonstrates:
 * - 3D particle track visualization using Three.js
 * - Interactive detector geometry
 * - Real-time event data loading and filtering
 * - Particle physics data visualization techniques
 * 
 * @author ATLAS Particle Viewer Team
 * @license MIT
 */

class AtlasParticleViewer {
  constructor() {
    this.scene = null;
    this.detector = null;
    this.particleTracks = null;
    this.dataLoader = null;
    this.uiManager = null;
    
    // Application state
    this.isInitialized = false;
    this.isLoading = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('🔬 Initializing ATLAS Particle Viewer...');
    console.log('DEBUG: Starting initialization process');
    
    try {
      this.showLoadingScreen();
      console.log('DEBUG: Loading screen shown');
      
      // Wait for DOM to be ready
      await this.waitForDOM();
      console.log('DEBUG: DOM ready');
      
      // Initialize core components
      await this.initializeComponents();
      console.log('DEBUG: Components initialized');
      
      // Load initial data
      await this.loadInitialData();
      console.log('DEBUG: Initial data loaded');
      
      this.hideLoadingScreen();
      this.isInitialized = true;
      
      console.log('✅ ATLAS Particle Viewer initialized successfully');
      this.showWelcomeMessage();
      
    } catch (error) {
      console.error('❌ Failed to initialize ATLAS Particle Viewer:', error);
      this.showErrorMessage(error.message);
    }
  }

  /**
   * Wait for DOM to be ready
   */
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Initialize all application components
   */
  async initializeComponents() {
    console.log('📦 Initializing components...');
    
    // Create main container if it doesn't exist
    let container = document.getElementById('three-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'three-container';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
        overflow: hidden;
        cursor: grab;
      `;
      document.body.appendChild(container);
    }

    // Initialize Three.js scene
    console.log('DEBUG: About to create ThreeScene');
    this.scene = new ThreeScene(container);
    console.log('✓ Three.js scene initialized');
    console.log('DEBUG: ThreeScene created successfully');

    // Initialize detector geometry
    console.log('DEBUG: About to create DetectorGeometry');
    this.detector = new DetectorGeometry();
    this.scene.add(this.detector.getGroup());
    console.log('✓ ATLAS detector geometry created');
    console.log('DEBUG: DetectorGeometry created and added');

    // Initialize particle track system
    console.log('DEBUG: About to create ParticleTracks');
    this.particleTracks = new ParticleTracks(this.scene.getScene());
    console.log('✓ Particle track system initialized');
    console.log('DEBUG: ParticleTracks created successfully');

    // Initialize data loader
    this.dataLoader = new DataLoader();
    console.log('✓ Data loader initialized');

    // Initialize UI manager
    this.uiManager = new UIManager(this.dataLoader, this.particleTracks, this.detector);
    console.log('✓ UI manager initialized');
  }

  /**
   * Load initial sample data
   */
  async loadInitialData() {
    console.log('📊 Loading initial sample data...');
    
    try {
      await this.uiManager.initWithSampleData();
      console.log('✓ Sample data loaded successfully');
    } catch (error) {
      console.warn('⚠️ Could not load sample data:', error.message);
      console.log('🔧 Attempting to create fallback demo data...');
      // Create fallback demo data if sample files fail to load
      this.createFallbackDemoData();
    }
  }

  /**
   * Show loading screen
   */
  showLoadingScreen() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-screen';
    loadingDiv.innerHTML = `
      <div class="loading-content">
        <div class="atlas-logo">
          <div class="logo-ring"></div>
          <div class="logo-ring"></div>
          <div class="logo-ring"></div>
        </div>
        <h1>ATLAS Particle Viewer</h1>
        <p>Loading detector geometry and event data...</p>
        <div class="loading-bar">
          <div class="loading-progress"></div>
        </div>
      </div>
    `;
    document.body.appendChild(loadingDiv);
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      }, 500);
    }
  }

  /**
   * Show welcome message
   */
  showWelcomeMessage() {
    // Show a brief welcome notification
    const welcomeEvent = new CustomEvent('showNotification', {
      detail: {
        message: 'Welcome to ATLAS Particle Viewer! Click a particle track to explore.',
        type: 'info'
      }
    });
    
    // Delay to let the UI settle
    setTimeout(() => {
      if (this.uiManager) {
        this.uiManager.showNotification('Welcome! Hover over tracks for info, click for details. Press H for help.', 'info');
      }
    }, 1000);
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-screen';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h1>⚠️ Error</h1>
        <p>${message}</p>
        <button onclick="location.reload()">Reload Application</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }

  /**
   * Create fallback demo data when sample files can't be loaded
   */
  createFallbackDemoData() {
    console.log('Creating fallback demo data...');
    
    const fallbackEvent = {
      event_id: 'demo-fallback',
      run_number: 999999,
      event_number: 1,
      vertex: { x: 0.0, y: 0.0, z: 0.0 },
      metadata: {
        collision_energy: '13 TeV',
        detector: 'ATLAS',
        event_type: 'demo_event',
        source: 'fallback_generator'
      },
      particles: [
        {
          id: 1,
          pdg: 11,
          type: 'electron',
          px: 20.0,
          py: -10.0,
          pz: 30.0,
          E: 40.0,
          charge: -1,
          trajectory: [
            { x: 0.0, y: 0.0, z: 0.0 },
            { x: 0.2, y: -0.1, z: 0.3 },
            { x: 0.4, y: -0.2, z: 0.6 },
            { x: 0.6, y: -0.3, z: 0.9 },
            { x: 0.8, y: -0.4, z: 1.2 }
          ]
        },
        {
          id: 2,
          pdg: 13,
          type: 'muon',
          px: -15.0,
          py: 25.0,
          pz: -20.0,
          E: 35.0,
          charge: -1,
          trajectory: [
            { x: 0.0, y: 0.0, z: 0.0 },
            { x: -0.15, y: 0.25, z: -0.2 },
            { x: -0.3, y: 0.5, z: -0.4 },
            { x: -0.45, y: 0.75, z: -0.6 },
            { x: -0.6, y: 1.0, z: -0.8 }
          ]
        },
        {
          id: 3,
          pdg: 22,
          type: 'photon',
          px: 12.0,
          py: 8.0,
          pz: 20.0,
          E: 25.0,
          charge: 0,
          trajectory: [
            { x: 0.0, y: 0.0, z: 0.0 },
            { x: 0.12, y: 0.08, z: 0.2 },
            { x: 0.24, y: 0.16, z: 0.4 },
            { x: 0.36, y: 0.24, z: 0.6 }
          ]
        }
      ]
    };
    
    try {
      // Load the fallback data directly
      this.dataLoader.events = [fallbackEvent];
      this.dataLoader.currentEventIndex = 0;
      this.dataLoader.currentEvent = fallbackEvent;
      
      // Trigger UI update
      if (this.uiManager && this.uiManager.loadEventData) {
        this.uiManager.loadEventData(fallbackEvent);
        this.uiManager.showNotification('Demo data loaded successfully', 'success');
      }
      
      console.log('✓ Fallback demo data created and loaded');
    } catch (error) {
      console.error('Failed to create fallback data:', error);
      this.showErrorMessage('Failed to load any particle data');
    }
  }

  /**
   * Handle application errors
   */
  handleError(error) {
    console.error('Application error:', error);
    
    if (this.uiManager) {
      this.uiManager.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Cleanup application resources
   */
  dispose() {
    console.log('🧹 Disposing application resources...');
    
    if (this.particleTracks) {
      this.particleTracks.dispose();
    }
    
    if (this.detector) {
      this.detector.dispose();
    }
    
    if (this.scene) {
      this.scene.dispose();
    }
    
    this.isInitialized = false;
    console.log('✓ Application disposed');
  }

  /**
   * Get application info
   */
  getInfo() {
    return {
      name: 'ATLAS Particle Viewer',
      version: '1.0.0',
      description: 'Browser-based 3D particle collision event viewer using CERN ATLAS Open Data',
      initialized: this.isInitialized,
      components: {
        scene: !!this.scene,
        detector: !!this.detector,
        particleTracks: !!this.particleTracks,
        dataLoader: !!this.dataLoader,
        uiManager: !!this.uiManager
      }
    };
  }
}

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Create and initialize application
const app = new AtlasParticleViewer();

// Make app globally available for debugging
window.atlasViewer = app;

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (app.isInitialized) {
    app.dispose();
  }
});

// Export for module systems
export default AtlasParticleViewer;