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
    
    try {
      this.showLoadingScreen();
      
      // Wait for DOM to be ready
      await this.waitForDOM();
      
      // Initialize core components
      await this.initializeComponents();
      
      // Load initial data
      await this.loadInitialData();
      
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
    this.scene = new ThreeScene(container);
    console.log('✓ Three.js scene initialized');

    // Initialize detector geometry
    this.detector = new DetectorGeometry();
    this.scene.add(this.detector.getGroup());
    console.log('✓ ATLAS detector geometry created');

    // Initialize particle track system
    this.particleTracks = new ParticleTracks(this.scene.getScene());
    console.log('✓ Particle track system initialized');

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