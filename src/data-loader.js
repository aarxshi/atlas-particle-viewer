/**
 * DataLoader - Loads and manages CERN ATLAS event data
 * Handles JSON/CSV parsing, event switching, and data validation
 */
export class DataLoader {
  constructor() {
    this.events = [];
    this.currentEventIndex = 0;
    this.currentEvent = null;
    this.isLoading = false;
    
    // Data validation schema
    this.eventSchema = {
      required: ['event_id', 'particles', 'vertex'],
      optional: ['run_number', 'event_number', 'metadata'],
      particle: {
        required: ['id', 'type', 'px', 'py', 'pz', 'E'],
        optional: ['pdg', 'charge', 'trajectory', 'calo_hits']
      }
    };
    
    // Available sample events
    this.sampleEvents = [
      { name: 'Low Multiplicity Event', file: './sample-data/event-001.json' },
      { name: 'High Multiplicity Event', file: './sample-data/event-002.json' }
    ];
  }

  /**
   * Load event from JSON file
   */
  async loadEvent(filePath) {
    this.isLoading = true;
    
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const eventData = await response.json();
      
      // Validate event data
      const validatedEvent = this.validateEvent(eventData);
      
      this.isLoading = false;
      return validatedEvent;
      
    } catch (error) {
      this.isLoading = false;
      console.error('Error loading event:', error);
      throw error;
    }
  }

  /**
   * Load multiple events
   */
  async loadEvents(filePaths) {
    this.events = [];
    
    for (const filePath of filePaths) {
      try {
        const event = await this.loadEvent(filePath);
        this.events.push(event);
      } catch (error) {
        console.error(`Failed to load event from ${filePath}:`, error);
      }
    }
    
    if (this.events.length > 0) {
      this.currentEventIndex = 0;
      this.currentEvent = this.events[0];
    }
    
    return this.events;
  }

  /**
   * Load all sample events
   */
  async loadSampleEvents() {
    const filePaths = this.sampleEvents.map(event => event.file);
    return this.loadEvents(filePaths);
  }

  /**
   * Load event from user file upload
   */
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const eventData = JSON.parse(e.target.result);
          const validatedEvent = this.validateEvent(eventData);
          resolve(validatedEvent);
        } catch (error) {
          reject(new Error('Invalid JSON format: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Parse CSV data (simple implementation)
   * Expected format: particle_id,type,px,py,pz,E,charge,...
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const particles = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;
      
      const particle = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        
        // Convert numeric fields
        if (['id', 'px', 'py', 'pz', 'E', 'charge', 'pdg'].includes(header)) {
          particle[header] = parseFloat(value) || 0;
        } else {
          particle[header] = value;
        }
      });
      
      // Generate simple linear trajectory if not provided
      if (!particle.trajectory) {
        particle.trajectory = this.generateSimpleTrajectory(particle);
      }
      
      particles.push(particle);
    }
    
    return {
      event_id: 'csv-import-' + Date.now(),
      vertex: { x: 0, y: 0, z: 0 },
      particles: particles,
      metadata: {
        source: 'CSV import',
        particle_count: particles.length
      }
    };
  }

  /**
   * Generate simple linear trajectory for CSV particles without trajectory data
   */
  generateSimpleTrajectory(particle) {
    const { px, py, pz } = particle;
    const momentum = Math.sqrt(px * px + py * py + pz * pz);
    
    if (momentum === 0) {
      return [{ x: 0, y: 0, z: 0 }];
    }
    
    // Normalize momentum direction
    const dirX = px / momentum;
    const dirY = py / momentum;
    const dirZ = pz / momentum;
    
    // Create trajectory points extending from origin
    const trajectory = [];
    const maxDistance = 5.0; // Maximum track length in detector units
    const numPoints = 6;
    
    for (let i = 0; i < numPoints; i++) {
      const distance = (i / (numPoints - 1)) * maxDistance;
      trajectory.push({
        x: distance * dirX,
        y: distance * dirY,
        z: distance * dirZ
      });
    }
    
    return trajectory;
  }

  /**
   * Validate event data against schema
   */
  validateEvent(eventData) {
    if (!eventData || typeof eventData !== 'object') {
      throw new Error('Event data must be an object');
    }
    
    // Check required fields
    for (const field of this.eventSchema.required) {
      if (!(field in eventData)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate vertex
    if (!eventData.vertex || typeof eventData.vertex !== 'object') {
      throw new Error('Vertex must be an object');
    }
    
    const vertex = eventData.vertex;
    if (typeof vertex.x !== 'number' || typeof vertex.y !== 'number' || typeof vertex.z !== 'number') {
      throw new Error('Vertex coordinates must be numbers');
    }
    
    // Validate particles
    if (!Array.isArray(eventData.particles)) {
      throw new Error('Particles must be an array');
    }
    
    const validatedParticles = eventData.particles.map((particle, index) => {
      return this.validateParticle(particle, index);
    });
    
    // Return validated event
    return {
      ...eventData,
      particles: validatedParticles,
      metadata: {
        ...eventData.metadata,
        particle_count: validatedParticles.length,
        validated_at: new Date().toISOString()
      }
    };
  }

  /**
   * Validate individual particle data
   */
  validateParticle(particle, index) {
    if (!particle || typeof particle !== 'object') {
      throw new Error(`Particle at index ${index} must be an object`);
    }
    
    // Check required particle fields
    for (const field of this.eventSchema.particle.required) {
      if (!(field in particle)) {
        throw new Error(`Particle ${index} missing required field: ${field}`);
      }
    }
    
    // Validate numeric fields
    const numericFields = ['px', 'py', 'pz', 'E'];
    for (const field of numericFields) {
      if (typeof particle[field] !== 'number' || isNaN(particle[field])) {
        throw new Error(`Particle ${index} field ${field} must be a valid number`);
      }
    }
    
    // Calculate derived properties
    const px = particle.px;
    const py = particle.py;
    const pz = particle.pz;
    const E = particle.E;
    
    const pt = Math.sqrt(px * px + py * py);
    const momentum = Math.sqrt(px * px + py * py + pz * pz);
    const eta = pz !== 0 ? -Math.log(Math.tan(Math.atan2(pt, Math.abs(pz)) / 2)) : 0;
    const phi = Math.atan2(py, px);
    
    // Validate trajectory if present
    let trajectory = particle.trajectory;
    if (trajectory) {
      if (!Array.isArray(trajectory)) {
        throw new Error(`Particle ${index} trajectory must be an array`);
      }
      
      trajectory = trajectory.map((point, pointIndex) => {
        if (!point || typeof point !== 'object') {
          throw new Error(`Particle ${index} trajectory point ${pointIndex} must be an object`);
        }
        
        if (typeof point.x !== 'number' || typeof point.y !== 'number' || typeof point.z !== 'number') {
          throw new Error(`Particle ${index} trajectory point ${pointIndex} coordinates must be numbers`);
        }
        
        return { x: point.x, y: point.y, z: point.z };
      });
    } else {
      // Generate simple trajectory if not provided
      trajectory = this.generateSimpleTrajectory(particle);
    }
    
    // Return validated particle with derived properties
    return {
      ...particle,
      trajectory: trajectory,
      derived: {
        pt: pt,
        momentum: momentum,
        eta: eta,
        phi: phi
      }
    };
  }

  /**
   * Get current event
   */
  getCurrentEvent() {
    return this.currentEvent;
  }

  /**
   * Get all loaded events
   */
  getEvents() {
    return this.events;
  }

  /**
   * Get event by index
   */
  getEvent(index) {
    if (index >= 0 && index < this.events.length) {
      return this.events[index];
    }
    return null;
  }

  /**
   * Switch to event by index
   */
  switchToEvent(index) {
    const event = this.getEvent(index);
    if (event) {
      this.currentEventIndex = index;
      this.currentEvent = event;
      return event;
    }
    return null;
  }

  /**
   * Go to next event
   */
  nextEvent() {
    if (this.events.length === 0) return null;
    
    const nextIndex = (this.currentEventIndex + 1) % this.events.length;
    return this.switchToEvent(nextIndex);
  }

  /**
   * Go to previous event
   */
  previousEvent() {
    if (this.events.length === 0) return null;
    
    const prevIndex = this.currentEventIndex === 0 
      ? this.events.length - 1 
      : this.currentEventIndex - 1;
    return this.switchToEvent(prevIndex);
  }

  /**
   * Get event count
   */
  getEventCount() {
    return this.events.length;
  }

  /**
   * Get current event index
   */
  getCurrentEventIndex() {
    return this.currentEventIndex;
  }

  /**
   * Filter particles in current event
   */
  filterParticles(filters) {
    if (!this.currentEvent) return [];
    
    let particles = [...this.currentEvent.particles];
    
    // Filter by particle types
    if (filters.types && filters.types.length > 0) {
      particles = particles.filter(p => filters.types.includes(p.type));
    }
    
    // Filter by energy range
    if (filters.minEnergy !== undefined) {
      particles = particles.filter(p => p.E >= filters.minEnergy);
    }
    
    if (filters.maxEnergy !== undefined) {
      particles = particles.filter(p => p.E <= filters.maxEnergy);
    }
    
    // Filter by transverse momentum range
    if (filters.minPt !== undefined) {
      particles = particles.filter(p => p.derived.pt >= filters.minPt);
    }
    
    if (filters.maxPt !== undefined) {
      particles = particles.filter(p => p.derived.pt <= filters.maxPt);
    }
    
    // Filter by charge
    if (filters.charge !== undefined) {
      particles = particles.filter(p => p.charge === filters.charge);
    }
    
    return particles;
  }

  /**
   * Get particle type statistics for current event
   */
  getParticleStatistics() {
    if (!this.currentEvent) return {};
    
    const stats = {};
    this.currentEvent.particles.forEach(particle => {
      const type = particle.type;
      if (!stats[type]) {
        stats[type] = {
          count: 0,
          totalEnergy: 0,
          totalPt: 0,
          averageEnergy: 0,
          averagePt: 0
        };
      }
      
      stats[type].count++;
      stats[type].totalEnergy += particle.E;
      stats[type].totalPt += particle.derived.pt;
    });
    
    // Calculate averages
    Object.keys(stats).forEach(type => {
      const stat = stats[type];
      stat.averageEnergy = stat.totalEnergy / stat.count;
      stat.averagePt = stat.totalPt / stat.count;
    });
    
    return stats;
  }

  /**
   * Get sample events list
   */
  getSampleEvents() {
    return this.sampleEvents;
  }

  /**
   * Export current event to JSON
   */
  exportCurrentEvent() {
    if (!this.currentEvent) return null;
    
    return JSON.stringify(this.currentEvent, null, 2);
  }

  /**
   * Clear all loaded events
   */
  clear() {
    this.events = [];
    this.currentEvent = null;
    this.currentEventIndex = 0;
  }

  /**
   * Get loading state
   */
  isLoadingData() {
    return this.isLoading;
  }
}