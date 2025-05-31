import * as THREE from 'three';
import { STLLoader } from './stlLoader';

export interface PreviewOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  modelColor?: number;
  cameraPosition?: { x: number; y: number; z: number };
  lighting?: {
    ambientIntensity?: number;
    directionalIntensity?: number;
  };
  quality?: 'low' | 'medium' | 'high';
}

export class PreviewGenerator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;

  constructor(options: PreviewOptions = {}) {
    const {
      width = 400,  // Increased from 300
      height = 300, // Increased from 200 and made square for better ratio
      backgroundColor = 0xf5f5f5,
      quality = 'high'
    } = options;

    // Adjust resolution based on quality
    const qualityMultiplier = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1;
    this.width = Math.floor(width * qualityMultiplier);
    this.height = Math.floor(height * qualityMultiplier);

    // Create high-quality canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Setup scene with better background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(backgroundColor);

    // Setup camera with better FOV
    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    // Setup high-quality renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(backgroundColor, 1.0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Setup professional lighting
    this.setupProfessionalLighting();
    
    console.log(`[PreviewGenerator] Created with ${this.width}x${this.height} (quality: ${quality})`);
  }

  private setupProfessionalLighting() {
    // Clear existing lights
    this.scene.children = this.scene.children.filter(child => !(child instanceof THREE.Light));

    // Key light (main directional light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 50;
    this.scene.add(keyLight);

    // Fill light (softer, from opposite side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-3, 2, -2);
    this.scene.add(fillLight);

    // Rim light (back lighting for definition)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(-2, -2, -5);
    this.scene.add(rimLight);

    // Ambient light (overall illumination)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Environment light (hemisphere for realistic lighting)
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.3);
    this.scene.add(hemiLight);
  }

  private calculateAdaptiveScale(modelSize: number): number {
    // Adaptive scaling algorithm based on model dimensions
    
    if (modelSize <= 0) {
      console.warn('[PreviewGenerator] Invalid model size, using default scale');
      return 3.0;
    }
    
    let scale: number;
    
    if (modelSize < 0.1) {
      // Very tiny models (< 0.1 units) - huge scale
      scale = 50.0;
    } else if (modelSize < 1.0) {
      // Small models (0.1 - 1 units) - large scale with smooth transition
      scale = 15.0 + (1.0 - modelSize) * 35.0; // 15-50 range
    } else if (modelSize < 10.0) {
      // Medium models (1 - 10 units) - moderate scale with smooth transition  
      scale = 3.0 + (10.0 - modelSize) / 9.0 * 12.0; // 3-15 range
    } else if (modelSize < 100.0) {
      // Large models (10 - 100 units) - smaller scale
      scale = 1.0 + (100.0 - modelSize) / 90.0 * 2.0; // 1-3 range
    } else {
      // Very large models (> 100 units) - minimal scale
      scale = Math.max(0.5, 100.0 / modelSize); // Minimum 0.5, scales down for very large models
    }
    
    // Ensure minimum visibility
    scale = Math.max(scale, 0.5);
    
    const category = modelSize < 0.1 ? 'very tiny' : 
                    modelSize < 1.0 ? 'small' :
                    modelSize < 10.0 ? 'medium' :
                    modelSize < 100.0 ? 'large' : 'very large';
                    
    console.log(`[PreviewGenerator] Model category: ${category} (size: ${modelSize.toFixed(3)}) -> scale: ${scale.toFixed(3)}`);
    
    return scale;
  }

  async generatePreview(
    modelUrl: string, 
    options: PreviewOptions = {}
  ): Promise<string> {
    try {
      console.log(`[PreviewGenerator] Generating high-quality preview for: ${modelUrl}`);
      
      // Clear scene
      this.clearScene();
      this.setupProfessionalLighting();
      
      // Update background if provided
      if (options.backgroundColor !== undefined) {
        this.scene.background = new THREE.Color(options.backgroundColor);
        this.renderer.setClearColor(options.backgroundColor, 1.0);
      }

      // Load STL model
      const stlLoader = new STLLoader();
      const geometry = await stlLoader.loadSTL(modelUrl);

      // Process geometry for optimal display
      geometry.computeBoundingBox();
      geometry.computeVertexNormals(); // Important for proper lighting
      
      const box = geometry.boundingBox!;
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Center the geometry
      geometry.translate(-center.x, -center.y, -center.z);

      // Adaptive scale calculation based on model size
      const maxSize = Math.max(size.x, size.y, size.z);
      const scale = this.calculateAdaptiveScale(maxSize);
      
      console.log(`[PreviewGenerator] Model original size: ${maxSize.toFixed(3)}, calculated scale: ${scale.toFixed(3)}`);
      
      geometry.scale(scale, scale, scale);

      // Create high-quality material
      const material = new THREE.MeshPhongMaterial({ 
        color: options.modelColor || 0x4a90e2,
        side: THREE.DoubleSide,
        shininess: 30,
        specular: 0x222222
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Position camera optimally based on scaled model
      this.positionCameraForBestView(size, scale, options.cameraPosition);

      // Add mesh to scene
      this.scene.add(mesh);

      // Add invisible ground plane for shadows
      const groundGeometry = new THREE.PlaneGeometry(20, 20);
      const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -2;
      ground.receiveShadow = true;
      this.scene.add(ground);

      // Render multiple times for better quality
      for (let i = 0; i < 3; i++) {
        this.renderer.render(this.scene, this.camera);
      }

      // Wait for final render
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Generate high-quality data URL
      const dataURL = this.canvas.toDataURL('image/png', 1.0);
      
      if (!dataURL || dataURL.length < 100) {
        throw new Error('Generated preview is invalid');
      }
      
      console.log(`[PreviewGenerator] High-quality preview generated: ${dataURL.length} chars`);
      return dataURL;
      
    } catch (error) {
      console.error(`[PreviewGenerator] Error generating preview:`, error);
      throw error;
    }
  }

  private positionCameraForBestView(
    modelSize: THREE.Vector3,
    scale: number,
    customPosition?: { x: number; y: number; z: number }
  ) {
    if (customPosition) {
      this.camera.position.set(customPosition.x, customPosition.y, customPosition.z);
      this.camera.lookAt(0, 0, 0);
      return;
    }

    // Calculate the actual scaled dimensions
    const scaledSize = modelSize.clone().multiplyScalar(scale);
    const maxScaledDimension = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);
    
    // Position camera to frame the scaled model nicely
    const distance = Math.max(maxScaledDimension * 1.5, 4); // Minimum distance of 4 units
    
    // 3/4 view angle for best model visibility in previews
    this.camera.position.set(
      distance * 0.7,   // x: slightly to the right
      distance * 0.5,   // y: elevated view  
      distance * 1.0    // z: straight back for good framing
    );
    
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    
    console.log(`[PreviewGenerator] Camera positioned at distance ${distance.toFixed(2)} for model size ${maxScaledDimension.toFixed(2)}`);
  }

  private clearScene() {
    const objectsToRemove = [...this.scene.children];
    objectsToRemove.forEach(object => {
      this.scene.remove(object);
      
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
  }

  dispose() {
    try {
      console.log('[PreviewGenerator] Disposing resources');
      
      this.clearScene();
      
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.forceContextLoss();
      }
      
      // Reset canvas
      if (this.canvas) {
        this.canvas.width = 1;
        this.canvas.height = 1;
      }
      
    } catch (error) {
      console.warn('[PreviewGenerator] Error during disposal:', error);
    }
  }
}

// Simplified export function with better defaults
export const generateModelPreview = async (
  modelUrl: string, 
  options: PreviewOptions = {}
): Promise<string> => {
  let generator: PreviewGenerator | null = null;
  
  try {
    // Use high quality by default
    generator = new PreviewGenerator({ 
      quality: 'high',
      width: 400,
      height: 300,
      ...options 
    });
    
    return await generator.generatePreview(modelUrl, options);
  } finally {
    if (generator) {
      generator.dispose();
    }
  }
}; 