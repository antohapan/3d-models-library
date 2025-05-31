import * as THREE from 'three';

export class STLLoader {
  private loader: THREE.BufferGeometry | null = null;

  async loadSTL(url: string): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.FileLoader();
      loader.setResponseType('arraybuffer');
      
      loader.load(
        url,
        (data) => {
          try {
            const geometry = this.parseSTL(data as ArrayBuffer);
            resolve(geometry);
          } catch (error) {
            reject(error);
          }
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  private parseSTL(data: ArrayBuffer): THREE.BufferGeometry {
    const isASCII = this.isASCII(data);
    
    if (isASCII) {
      return this.parseASCII(new TextDecoder().decode(data));
    } else {
      return this.parseBinary(new DataView(data));
    }
  }

  private isASCII(data: ArrayBuffer): boolean {
    const header = new TextDecoder().decode(data.slice(0, 80));
    return header.toLowerCase().includes('solid');
  }

  private parseASCII(data: string): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];

    const lines = data.split('\n');
    let currentNormal: THREE.Vector3 | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('facet normal')) {
        const parts = line.split(/\s+/);
        currentNormal = new THREE.Vector3(
          parseFloat(parts[2]),
          parseFloat(parts[3]),
          parseFloat(parts[4])
        );
      } else if (line.startsWith('vertex')) {
        const parts = line.split(/\s+/);
        vertices.push(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        );
        
        if (currentNormal) {
          normals.push(currentNormal.x, currentNormal.y, currentNormal.z);
        }
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return geometry;
  }

  private parseBinary(reader: DataView): THREE.BufferGeometry {
    const faces = reader.getUint32(80, true);
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];

    let offset = 84;
    
    for (let i = 0; i < faces; i++) {
      // Normal vector
      const nx = reader.getFloat32(offset, true);
      const ny = reader.getFloat32(offset + 4, true);
      const nz = reader.getFloat32(offset + 8, true);
      offset += 12;

      // Vertices
      for (let j = 0; j < 3; j++) {
        vertices.push(
          reader.getFloat32(offset, true),
          reader.getFloat32(offset + 4, true),
          reader.getFloat32(offset + 8, true)
        );
        normals.push(nx, ny, nz);
        offset += 12;
      }

      offset += 2; // Skip attribute byte count
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return geometry;
  }
} 