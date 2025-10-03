# ATLAS Particle Viewer

A browser-based 3D particle collision event viewer using CERN ATLAS Open Data. This application provides an interactive visualization of particle physics collisions with realistic detector geometry and particle tracking.

![ATLAS Particle Viewer](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Three.js](https://img.shields.io/badge/Three.js-r157-orange) ![WebGL](https://img.shields.io/badge/WebGL-2.0-red)

## Features

### 🔬 **Physics Visualization**
- **3D Detector Geometry**: Stylized ATLAS detector with barrel, endcaps, and layered systems
- **Particle Tracks**: Color-coded tracks with physics-accurate momentum mapping
- **Interactive Selection**: Click tracks to view detailed particle information
- **Real-time Animation**: Smooth track emergence animation from collision vertex

### 🎯 **Technical Features**
- **GPU Optimized**: Efficient Three.js rendering with performance monitoring
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Data Flexibility**: Supports JSON/CSV data import with validation
- **Performance Scaling**: Automatic LOD for high-multiplicity events

### 🎮 **User Interface**
- **Intuitive Controls**: Mouse orbit, zoom, and keyboard shortcuts
- **Filtering System**: Filter by particle type, energy, and momentum
- **Event Management**: Switch between multiple collision events
- **Information Panels**: Detailed physics data display with tooltips

## Quick Start

### Option 1: Enhanced ATLAS Viewer (Recommended)

The enhanced version with full animation and controls:

```bash
# Clone the repository
git clone https://github.com/your-repo/atlas-particle-viewer.git
cd atlas-particle-viewer

# Install dependencies
npm install

# Start a local server
python -m http.server 8080

# Open enhanced viewer
open http://localhost:8080/atlas-viewer.html
```

### Option 2: Standalone Demo (No Installation Required)

Simply open `standalone-demo.html` in any modern web browser:

```bash
# Download the standalone demo
wget https://raw.githubusercontent.com/your-repo/atlas-particle-viewer/main/standalone-demo.html

# Open in browser (or double-click the file)
open standalone-demo.html  # macOS
xdg-open standalone-demo.html  # Linux
start standalone-demo.html  # Windows
```

### Option 2: Development Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/atlas-particle-viewer.git
cd atlas-particle-viewer

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
atlas-particle-viewer/
├── src/
│   ├── main.js              # Application entry point
│   ├── three-scene.js       # Three.js scene management
│   ├── detector-geometry.js # ATLAS detector construction
│   ├── particle-tracks.js   # Particle track rendering
│   ├── data-loader.js       # Event data management
│   └── ui.js                # User interface management
├── sample-data/
│   ├── event-001.json       # Low multiplicity sample event
│   └── event-002.json       # High multiplicity sample event
├── index.html               # Development HTML file
├── standalone-demo.html     # Single-file demo
├── styles.css               # Application styling
├── package.json             # Project configuration
├── vite.config.js          # Build configuration
└── README.md               # This file
```

## Data Format

### JSON Event Schema

The application expects event data in the following JSON format:

```json
{
  "event_id": "evt-001",
  "run_number": 123456,
  "event_number": 789,
  "vertex": {"x": 0.0, "y": 0.0, "z": 0.0},
  "metadata": {
    "collision_energy": "13 TeV",
    "detector": "ATLAS",
    "event_type": "low_multiplicity"
  },
  "particles": [
    {
      "id": 1,
      "pdg": 11,
      "type": "electron",
      "px": 25.3,
      "py": -8.5,
      "pz": 45.2,
      "E": 52.1,
      "charge": -1,
      "trajectory": [
        {"x": 0.0, "y": 0.0, "z": 0.0},
        {"x": 0.15, "y": -0.05, "z": 0.27},
        {"x": 0.35, "y": -0.12, "z": 0.62}
      ],
      "calo_hits": [
        {"layer": "EM", "energy": 48.5, "eta": 0.85, "phi": -0.32},
        {"layer": "HAD", "energy": 2.1, "eta": 0.87, "phi": -0.33}
      ]
    }
  ]
}
```

#### Required Fields

**Event Level:**
- `event_id`: Unique event identifier (string)
- `particles`: Array of particle objects
- `vertex`: Collision vertex coordinates (`{x, y, z}`)

**Particle Level:**
- `id`: Unique particle identifier (integer)
- `type`: Particle type name (string)
- `px`, `py`, `pz`: Momentum components in GeV/c (numbers)
- `E`: Energy in GeV (number)

#### Optional Fields

**Event Level:**
- `run_number`, `event_number`: ATLAS data identifiers
- `metadata`: Additional event information

**Particle Level:**
- `pdg`: PDG particle code (integer)
- `charge`: Electric charge (integer)
- `trajectory`: Array of 3D track points (`{x, y, z}`)
- `calo_hits`: Calorimeter energy deposits

### Supported Particle Types

| Type | Symbol | Color | PDG Code |
|------|--------|-------|----------|
| `electron` | e⁻ | Green | 11 |
| `positron` | e⁺ | Light Green | -11 |
| `muon` | μ | Red | 13 |
| `photon` | γ | Yellow | 22 |
| `pion_plus` | π⁺ | Blue | 211 |
| `pion_minus` | π⁻ | Purple | -211 |
| `kaon_plus` | K⁺ | Orange | 321 |
| `proton` | p | Pink | 2212 |
| `neutron` | n | Gray | 2112 |

## Converting CERN ROOT Data

### Using ROOT's JSON Export

```cpp
// ROOT macro to convert ATLAS data to JSON
void atlas_to_json() {
    TFile* file = TFile::Open("atlas_data.root");
    TTree* tree = (TTree*)file->Get("CollectionTree");
    
    // Create JSON output
    std::ofstream json_file("event_data.json");
    json_file << "{\"event_id\": \"" << event_id << "\",\n";
    json_file << "\"vertex\": {\"x\": " << vertex_x << ", \"y\": " << vertex_y << ", \"z\": " << vertex_z << "},\n";
    json_file << "\"particles\": [\n";
    
    // Loop through particles
    for (int i = 0; i < n_particles; i++) {
        json_file << "{";
        json_file << "\"id\": " << particle_id[i] << ",";
        json_file << "\"type\": \"" << GetParticleType(particle_pdg[i]) << "\",";
        json_file << "\"px\": " << particle_px[i] << ",";
        json_file << "\"py\": " << particle_py[i] << ",";
        json_file << "\"pz\": " << particle_pz[i] << ",";
        json_file << "\"E\": " << particle_E[i] << ",";
        json_file << "\"charge\": " << particle_charge[i];
        
        // Add trajectory if available
        if (track_points[i].size() > 0) {
            json_file << ",\"trajectory\": [";
            for (auto& point : track_points[i]) {
                json_file << "{\"x\": " << point.x << ", \"y\": " << point.y << ", \"z\": " << point.z << "}";
                if (&point != &track_points[i].back()) json_file << ",";
            }
            json_file << "]";
        }
        
        json_file << "}";
        if (i < n_particles - 1) json_file << ",";
        json_file << "\n";
    }
    
    json_file << "]}\n";
    json_file.close();
}
```

### Using Python with uproot

```python
import uproot
import json
import numpy as np

def root_to_json(root_file, output_file):
    """Convert ROOT file to JSON format"""
    
    # Open ROOT file
    file = uproot.open(root_file)
    tree = file["CollectionTree"]
    
    events = []
    
    # Read event data
    for event_id, (vertex_x, vertex_y, vertex_z, 
                   particle_px, particle_py, particle_pz, 
                   particle_E, particle_pdg) in enumerate(
        tree.iterate(["vertex_x", "vertex_y", "vertex_z",
                      "particle_px", "particle_py", "particle_pz", 
                      "particle_E", "particle_pdg"], 
                     library="np")):
        
        particles = []
        for i in range(len(particle_px)):
            # Generate trajectory (simplified - in reality use track reconstruction)
            trajectory = generate_trajectory(
                particle_px[i], particle_py[i], particle_pz[i]
            )
            
            particle = {
                "id": i + 1,
                "pdg": int(particle_pdg[i]),
                "type": pdg_to_type(particle_pdg[i]),
                "px": float(particle_px[i]),
                "py": float(particle_py[i]),
                "pz": float(particle_pz[i]),
                "E": float(particle_E[i]),
                "trajectory": trajectory
            }
            particles.append(particle)
        
        event_data = {
            "event_id": f"evt-{event_id:06d}",
            "vertex": {
                "x": float(vertex_x),
                "y": float(vertex_y), 
                "z": float(vertex_z)
            },
            "particles": particles
        }
        events.append(event_data)
    
    # Save to JSON
    with open(output_file, 'w') as f:
        json.dump(events, f, indent=2)

def pdg_to_type(pdg):
    """Convert PDG code to particle type string"""
    pdg_map = {
        11: "electron", -11: "positron",
        13: "muon", -13: "antimuon",
        22: "photon",
        211: "pion_plus", -211: "pion_minus",
        321: "kaon_plus", -321: "kaon_minus",
        2212: "proton", 2112: "neutron"
    }
    return pdg_map.get(pdg, "unknown")

def generate_trajectory(px, py, pz, n_points=6):
    """Generate simple linear trajectory"""
    momentum = np.sqrt(px*px + py*py + pz*pz)
    if momentum == 0:
        return [{"x": 0, "y": 0, "z": 0}]
    
    # Normalize direction
    dir_x, dir_y, dir_z = px/momentum, py/momentum, pz/momentum
    
    # Generate points along trajectory
    trajectory = []
    max_distance = 5.0  # Maximum track length
    
    for i in range(n_points):
        distance = (i / (n_points - 1)) * max_distance
        trajectory.append({
            "x": distance * dir_x,
            "y": distance * dir_y,
            "z": distance * dir_z
        })
    
    return trajectory

# Usage
root_to_json("atlas_data.root", "converted_events.json")
```

### CSV Format (Alternative)

For simpler data, CSV format is also supported:

```csv
particle_id,type,px,py,pz,E,charge
1,electron,25.3,-8.5,45.2,52.1,-1
2,muon,35.8,12.4,78.9,87.2,-1
3,photon,-8.2,-15.7,28.1,33.4,0
```

**Note**: CSV format will generate simple linear trajectories. For accurate track visualization, use JSON format with full trajectory data.

## Controls

### Mouse Controls
- **Left Click + Drag**: Rotate camera around detector
- **Right Click + Drag**: Pan camera
- **Scroll Wheel**: Zoom in/out
- **Click Particle Track**: Show detailed information
- **Hover Track**: Quick info tooltip

### Keyboard Shortcuts
- **R**: Reset camera to default view
- **U**: Toggle UI panel visibility
- **Space**: Play/pause track animation
- **A**: Toggle coordinate axes
- **H**: Show help modal (in development version)

### UI Controls
- **Event Selector**: Switch between loaded events
- **Particle Filters**: Filter by type, energy, momentum
- **Detector Layers**: Toggle layer visibility
- **Animation Controls**: Play/pause, reset, speed adjustment

## Physics Background

### ATLAS Detector

The ATLAS (A Toroidal LHC ApparatuS) detector is one of the main particle detectors at CERN's Large Hadron Collider (LHC). This visualization represents a simplified version of the detector with the following components:

#### Detector Layers (Inner to Outer)

1. **Inner Tracker** (Blue)
   - **Purpose**: Track charged particle trajectories
   - **Technology**: Silicon pixels and strips
   - **Radius**: ~0.3-1.5 meters

2. **Electromagnetic Calorimeter** (Green)
   - **Purpose**: Measure energy of electrons and photons
   - **Technology**: Liquid argon sampling calorimeter
   - **Radius**: ~1.8-2.4 meters

3. **Hadronic Calorimeter** (Red)
   - **Purpose**: Measure energy of hadrons (pions, kaons, etc.)
   - **Technology**: Scintillating tiles with steel absorber
   - **Radius**: ~2.8-4.0 meters

4. **Muon System** (Purple)
   - **Purpose**: Detect and measure muons
   - **Technology**: Drift tubes and trigger chambers
   - **Radius**: ~4.5-6.0 meters

### Physics Quantities

The application displays standard particle physics quantities:

- **Energy (E)**: Total energy of the particle in GeV
- **Momentum Components**: px, py, pz in GeV/c
- **Transverse Momentum (pₜ)**: pₜ = √(px² + py²)
- **Total Momentum (|p|)**: |p| = √(px² + py² + pz²)
- **Pseudorapidity (η)**: η = -ln(tan(θ/2)) where θ is polar angle
- **Azimuthal Angle (φ)**: φ = arctan(py/px)
- **Electric Charge**: In units of elementary charge (e)

### Particle Identification

Particles are identified by their interaction patterns in different detector layers:

- **Electrons**: Leave tracks in inner detector + energy in EM calorimeter
- **Photons**: No track, but energy deposit in EM calorimeter  
- **Muons**: Penetrate all layers, leave tracks in inner detector and muon system
- **Hadrons**: Leave tracks + energy in hadronic calorimeter
- **Neutrinos**: Invisible, inferred from missing energy

## Performance Optimization

### Automatic Performance Scaling

The application automatically adjusts rendering quality based on event complexity:

- **< 100 particles**: Full detail rendering with tube geometries
- **100-500 particles**: Balanced rendering with optimized materials
- **> 500 particles**: Simplified line rendering with performance warnings

### Manual Optimization

For better performance on lower-end devices:

1. **Reduce Particle Count**: Use energy/momentum filters
2. **Hide Detector Layers**: Toggle off unused detector components
3. **Disable Animation**: Use static display mode
4. **Lower Browser Zoom**: Reduces pixel density requirements

### System Requirements

**Minimum:**
- Modern browser with WebGL 1.0 support
- 2GB RAM
- Integrated graphics

**Recommended:**
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- 4GB RAM
- Dedicated graphics card
- 1920x1080 display resolution

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview
```

### Architecture Overview

The application follows a modular architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DataLoader    │────│   UIManager      │────│   ThreeScene    │
│                 │    │                  │    │                 │
│ • JSON/CSV      │    │ • Controls       │    │ • Camera        │
│ • Validation    │    │ • Filters        │    │ • Lighting      │
│ • Event Mgmt    │    │ • Tooltips       │    │ • Animation     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐    ┌─────────────────┐
                    │ ParticleTracks   │────│ DetectorGeometry │
                    │                  │    │                 │
                    │ • Track Rendering│    │ • ATLAS Geometry│
                    │ • GPU Optimization│   │ • Layer Control │
                    │ • Interaction    │    │ • Transparency  │
                    └──────────────────┘    └─────────────────┘
```

### Adding New Particle Types

To add support for new particle types:

1. **Update particle configuration** in `src/particle-tracks.js`:
```javascript
const PARTICLE_CONFIG = {
  // ... existing particles
  new_particle: { 
    color: 0xFF00FF, 
    name: 'New Particle', 
    symbol: 'X', 
    thickness: 2.0 
  }
};
```

2. **Add PDG mapping** in `src/data-loader.js`:
```javascript
const pdgToType = {
  // ... existing mappings  
  999: 'new_particle'
};
```

3. **Update legend** in `src/ui.js` (automatic from config)

### Custom Detector Geometry

To modify the detector geometry, edit `src/detector-geometry.js`:

```javascript
// Add new detector layer
createCustomLayer() {
  const geometry = new THREE.CylinderGeometry(radius1, radius2, height, 32, 1, true);
  const material = new THREE.MeshLambertMaterial({ 
    color: 0xFFFFFF, 
    transparent: true, 
    opacity: 0.3 
  });
  const layer = new THREE.Mesh(geometry, material);
  this.layers.customLayer.group.add(layer);
}
```

## Deployment

### Static Hosting

The built application is fully static and can be hosted on any web server:

```bash
# Build for production
npm run build

# Deploy dist/ folder to your server
rsync -av dist/ user@server:/var/www/atlas-viewer/
```

### GitHub Pages

```bash
# Build and deploy to gh-pages branch
npm run build
npx gh-pages -d dist
```

### Docker Deployment

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Troubleshooting

### Common Issues

**Q: Application shows black screen**
A: Check browser console for WebGL errors. Ensure your browser supports WebGL 1.0 or higher.

**Q: Particle tracks don't appear**  
A: Verify your JSON data follows the correct schema. Check the browser console for validation errors.

**Q: Poor performance with large events**
A: Enable simplified rendering in performance settings, or filter particles to reduce count.

**Q: Mouse controls don't work**
A: Ensure JavaScript is enabled. Try refreshing the page or restarting the browser.

### Browser Compatibility

| Browser | Minimum Version | WebGL Support | Notes |
|---------|----------------|---------------|--------|
| Chrome | 61+ | ✅ Full | Best performance |
| Firefox | 60+ | ✅ Full | Good performance |  
| Safari | 10.1+ | ✅ Limited | Some transparency issues |
| Edge | 16+ | ✅ Full | Good performance |
| Mobile Safari | 13+ | ✅ Limited | Reduced features |
| Chrome Mobile | 88+ | ✅ Good | Touch controls |

### Performance Tips

1. **Close other browser tabs** to free up GPU memory
2. **Use lower display resolution** if performance is poor  
3. **Update graphics drivers** for better WebGL support
4. **Enable hardware acceleration** in browser settings
5. **Use Chrome/Firefox** for best WebGL performance

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/atlas-particle-viewer.git
cd atlas-particle-viewer

# Create feature branch
git checkout -b feature/your-feature

# Install dependencies
npm install

# Start development server
npm run dev

# Make changes and test
# ...

# Commit and push
git commit -m "Add your feature"
git push origin feature/your-feature

# Create pull request
```

### Code Style

- **JavaScript**: ES6+ modules, JSDoc comments
- **CSS**: BEM methodology, mobile-first responsive design
- **HTML**: Semantic markup, accessibility attributes
- **Git**: Conventional commits format

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **CERN ATLAS Collaboration** for Open Data initiative
- **Three.js Community** for excellent 3D library
- **Open Source Community** for inspiration and tools

## Links

- **CERN Open Data Portal**: http://opendata.cern.ch/
- **ATLAS Experiment**: https://atlas.cern/
- **Three.js Documentation**: https://threejs.org/docs/
- **WebGL Specification**: https://www.khronos.org/webgl/

---
