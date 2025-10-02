import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * ThreeScene - Core Three.js scene management
 * Handles scene, camera, renderer, lighting, and controls
 */
export class ThreeScene {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Performance monitoring
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    
    // Animation state
    this.animationId = null;
    this.isPlaying = true;
    
    this.init();
    this.setupEventListeners();
  }

  /**
   * Initialize the Three.js scene, camera, renderer, and lighting
   */
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a); // Dark space-like background

    // Setup camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(5, 3, 8);
    this.camera.lookAt(0, 0, 0);

    // Setup renderer with WebGL2 and optimizations
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Enable depth sorting for transparency
    this.renderer.sortObjects = true;
    
    this.container.appendChild(this.renderer.domElement);

    // Setup orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI;

    // Setup lighting
    this.setupLighting();

    // Add coordinate axes helper (can be toggled)
    this.axesHelper = new THREE.AxesHelper(2);
    this.scene.add(this.axesHelper);

    // Start render loop
    this.animate();
  }

  /**
   * Setup scene lighting for good visibility of detector and particles
   */
  setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Main directional light
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(10, 10, 5);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 2048;
    directionalLight1.shadow.mapSize.height = 2048;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 50;
    directionalLight1.shadow.camera.left = -10;
    directionalLight1.shadow.camera.right = 10;
    directionalLight1.shadow.camera.top = 10;
    directionalLight1.shadow.camera.bottom = -10;
    this.scene.add(directionalLight1);

    // Secondary directional light for fill
    const directionalLight2 = new THREE.DirectionalLight(0x8888ff, 0.3);
    directionalLight2.position.set(-5, 5, -5);
    this.scene.add(directionalLight2);

    // Point light at origin for collision vertex illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  /**
   * Setup event listeners for window resize and keyboard shortcuts
   */
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Keyboard shortcuts
    window.addEventListener('keydown', (event) => this.onKeyDown(event));

    // Mouse events for particle selection
    this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
    this.renderer.domElement.addEventListener('click', (event) => this.onClick(event));
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Handle keyboard shortcuts
   * R - Reset camera view
   * U - Toggle UI visibility
   * SPACE - Toggle animation play/pause
   * A - Toggle axes helper
   */
  onKeyDown(event) {
    switch (event.code) {
      case 'KeyR':
        this.resetCamera();
        break;
      case 'KeyU':
        this.toggleUI();
        break;
      case 'Space':
        event.preventDefault();
        this.toggleAnimation();
        break;
      case 'KeyA':
        this.toggleAxes();
        break;
    }
  }

  /**
   * Reset camera to default position
   */
  resetCamera() {
    this.camera.position.set(5, 3, 8);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
  }

  /**
   * Toggle UI visibility
   */
  toggleUI() {
    const ui = document.querySelector('.ui-overlay');
    if (ui) {
      ui.style.display = ui.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * Toggle animation play/pause
   */
  toggleAnimation() {
    this.isPlaying = !this.isPlaying;
    const event = new CustomEvent('animationToggle', { detail: { isPlaying: this.isPlaying } });
    window.dispatchEvent(event);
  }

  /**
   * Toggle axes helper visibility
   */
  toggleAxes() {
    this.axesHelper.visible = !this.axesHelper.visible;
  }

  /**
   * Handle mouse move for particle hover detection
   */
  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Emit mouse move event for particle hover
    const customEvent = new CustomEvent('sceneMouseMove', { 
      detail: { mouse: this.mouse, raycaster: this.raycaster, camera: this.camera, scene: this.scene }
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * Handle mouse click for particle selection
   */
  onClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Emit click event for particle selection
    const customEvent = new CustomEvent('sceneClick', { 
      detail: { 
        mouse: this.mouse, 
        raycaster: this.raycaster, 
        camera: this.camera, 
        scene: this.scene,
        clientX: event.clientX,
        clientY: event.clientY
      }
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * Main animation loop
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Update controls
    this.controls.update();

    // Update performance monitoring
    this.updateFPS();

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update FPS monitoring
   */
  updateFPS() {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Emit FPS update event
      const event = new CustomEvent('fpsUpdate', { detail: { fps: this.fps } });
      window.dispatchEvent(event);
    }
  }

  /**
   * Add object to scene
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Get scene reference
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get camera reference
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Get renderer reference
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.controls.dispose();
    this.renderer.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}