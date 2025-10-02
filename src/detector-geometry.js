import * as THREE from 'three';

/**
 * DetectorGeometry - Creates stylized ATLAS detector geometry
 * Includes barrel, endcaps, and layered detector systems
 */
export class DetectorGeometry {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'detector';
    
    // Layer visibility state
    this.layers = {
      innerTracker: { visible: true, group: new THREE.Group() },
      emCalorimeter: { visible: true, group: new THREE.Group() },
      hadCalorimeter: { visible: true, group: new THREE.Group() },
      muonSystem: { visible: true, group: new THREE.Group() },
      support: { visible: true, group: new THREE.Group() }
    };

    // Add layer groups to main group
    Object.values(this.layers).forEach(layer => {
      layer.group.name = layer.group.name || 'layer';
      this.group.add(layer.group);
    });

    this.buildDetector();
  }

  /**
   * Build the complete ATLAS detector geometry
   */
  buildDetector() {
    this.createInnerTracker();
    this.createEMCalorimeter();
    this.createHadronicCalorimeter();
    this.createMuonSystem();
    this.createSupportStructure();
    this.createCollisionVertex();
  }

  /**
   * Create inner tracking detector (silicon tracker)
   */
  createInnerTracker() {
    const group = this.layers.innerTracker.group;
    group.name = 'innerTracker';

    // Pixel detector (innermost layer)
    const pixelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 32, 1, true);
    const pixelMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4169E1, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide 
    });
    const pixelDetector = new THREE.Mesh(pixelGeometry, pixelMaterial);
    group.add(pixelDetector);

    // Strip tracker (outer layer)
    const stripGeometry = new THREE.CylinderGeometry(1.0, 1.0, 6, 32, 1, true);
    const stripMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x1E90FF, 
      transparent: true, 
      opacity: 0.2,
      side: THREE.DoubleSide 
    });
    const stripDetector = new THREE.Mesh(stripGeometry, stripMaterial);
    group.add(stripDetector);

    // Transition radiation tracker
    const trtGeometry = new THREE.CylinderGeometry(1.5, 1.5, 6, 32, 1, true);
    const trtMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x00BFFF, 
      transparent: true, 
      opacity: 0.15,
      side: THREE.DoubleSide,
      wireframe: false
    });
    const trtDetector = new THREE.Mesh(trtGeometry, trtMaterial);
    group.add(trtDetector);

    // Add endcap disks
    this.createEndcapDisks(group, 0.3, 1.5, 3, 0x4169E1, 0.2);
  }

  /**
   * Create electromagnetic calorimeter
   */
  createEMCalorimeter() {
    const group = this.layers.emCalorimeter.group;
    group.name = 'emCalorimeter';

    // Barrel EM calorimeter
    const emGeometry = new THREE.CylinderGeometry(2.2, 2.2, 6, 32, 1, true);
    const emMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x32CD32, 
      transparent: true, 
      opacity: 0.25,
      side: THREE.DoubleSide 
    });
    const emCalorimeter = new THREE.Mesh(emGeometry, emMaterial);
    group.add(emCalorimeter);

    // Add sampling structure (visual detail)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 2.2;
      const z = Math.sin(angle) * 2.2;
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -3, z),
        new THREE.Vector3(x, 3, z)
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x228B22, opacity: 0.6, transparent: true });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      group.add(line);
    }

    // EM endcaps
    this.createEndcapDisks(group, 1.8, 2.4, 3.5, 0x32CD32, 0.2);
  }

  /**
   * Create hadronic calorimeter
   */
  createHadronicCalorimeter() {
    const group = this.layers.hadCalorimeter.group;
    group.name = 'hadCalorimeter';

    // Barrel hadronic calorimeter
    const hadGeometry = new THREE.CylinderGeometry(3.5, 3.5, 6, 32, 1, true);
    const hadMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xFF6347, 
      transparent: true, 
      opacity: 0.2,
      side: THREE.DoubleSide 
    });
    const hadCalorimeter = new THREE.Mesh(hadGeometry, hadMaterial);
    group.add(hadCalorimeter);

    // Add tile structure representation
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const x = Math.cos(angle) * 3.5;
      const z = Math.sin(angle) * 3.5;
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -3, z),
        new THREE.Vector3(x, 3, z)
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xCD5C5C, opacity: 0.4, transparent: true });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      group.add(line);
    }

    // Hadronic endcaps
    this.createEndcapDisks(group, 2.8, 4.0, 4.5, 0xFF6347, 0.15);
  }

  /**
   * Create muon detection system
   */
  createMuonSystem() {
    const group = this.layers.muonSystem.group;
    group.name = 'muonSystem';

    // Muon barrel chambers
    const muonGeometry = new THREE.CylinderGeometry(5.5, 5.5, 8, 32, 1, true);
    const muonMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x9370DB, 
      transparent: true, 
      opacity: 0.15,
      side: THREE.DoubleSide 
    });
    const muonBarrel = new THREE.Mesh(muonGeometry, muonMaterial);
    group.add(muonBarrel);

    // Muon drift tubes representation
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 5.5;
      const z = Math.sin(angle) * 5.5;
      
      // Create chambers
      const chamberGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.1);
      const chamberMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x8A2BE2, 
        transparent: true, 
        opacity: 0.5 
      });
      const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
      chamber.position.set(x, 0, z);
      chamber.lookAt(0, 0, 0);
      group.add(chamber);
    }

    // Muon endcaps
    this.createEndcapDisks(group, 4.5, 6.0, 5.5, 0x9370DB, 0.1);
  }

  /**
   * Create support structure and beam pipe
   */
  createSupportStructure() {
    const group = this.layers.support.group;
    group.name = 'support';

    // Beam pipe
    const beamPipeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 12, 16);
    const beamPipeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x404040, 
      transparent: true, 
      opacity: 0.8 
    });
    const beamPipe = new THREE.Mesh(beamPipeGeometry, beamPipeMaterial);
    beamPipe.name = 'beamPipe';
    group.add(beamPipe);

    // Support rails
    const railGeometry = new THREE.BoxGeometry(0.1, 0.1, 10);
    const railMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const radius = 6.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.position.set(x, 0, z);
      group.add(rail);
    }
  }

  /**
   * Create collision vertex marker
   */
  createCollisionVertex() {
    // Primary vertex indicator
    const vertexGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const vertexMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFFFFF, 
      emissive: 0x222222
    });
    const vertex = new THREE.Mesh(vertexGeometry, vertexMaterial);
    vertex.name = 'primaryVertex';
    vertex.position.set(0, 0, 0);
    this.group.add(vertex);

    // Add small glow effect
    const glowGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFFFFFF, 
      transparent: true, 
      opacity: 0.3 
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(0, 0, 0);
    this.group.add(glow);
  }

  /**
   * Create endcap disk structures
   */
  createEndcapDisks(group, innerRadius, outerRadius, zPosition, color, opacity) {
    const diskGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
    const diskMaterial = new THREE.MeshLambertMaterial({ 
      color: color, 
      transparent: true, 
      opacity: opacity,
      side: THREE.DoubleSide 
    });

    // Positive endcap
    const diskPos = new THREE.Mesh(diskGeometry, diskMaterial);
    diskPos.position.z = zPosition;
    diskPos.rotation.x = Math.PI / 2;
    group.add(diskPos);

    // Negative endcap
    const diskNeg = new THREE.Mesh(diskGeometry, diskMaterial);
    diskNeg.position.z = -zPosition;
    diskNeg.rotation.x = Math.PI / 2;
    group.add(diskNeg);
  }

  /**
   * Toggle layer visibility
   */
  toggleLayer(layerName) {
    if (this.layers[layerName]) {
      this.layers[layerName].visible = !this.layers[layerName].visible;
      this.layers[layerName].group.visible = this.layers[layerName].visible;
      return this.layers[layerName].visible;
    }
    return false;
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(layerName, visible) {
    if (this.layers[layerName]) {
      this.layers[layerName].visible = visible;
      this.layers[layerName].group.visible = visible;
    }
  }

  /**
   * Get all layer names
   */
  getLayerNames() {
    return Object.keys(this.layers);
  }

  /**
   * Get layer visibility status
   */
  getLayerVisibility(layerName) {
    return this.layers[layerName] ? this.layers[layerName].visible : false;
  }

  /**
   * Update detector position (e.g., for vertex offset)
   */
  setVertexPosition(x, y, z) {
    // Find and update the primary vertex position
    const vertex = this.group.getObjectByName('primaryVertex');
    if (vertex) {
      vertex.position.set(x, y, z);
    }
  }

  /**
   * Get the detector group for adding to scene
   */
  getGroup() {
    return this.group;
  }

  /**
   * Dispose of detector geometry
   */
  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}