'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { STLLoader } from '../utils/stlLoader';

interface Model3DViewerProps {
  modelUrl: string;
  width?: number;
  height?: number;
  className?: string;
}

export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  modelUrl,
  width = 400,
  height = 300,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Three.js objects - using refs to persist across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Mouse interaction state
  const mouseRef = useRef({
    isDown: false,
    lastX: 0,
    lastY: 0
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log(`[Model3DViewer] Cleaning up for: ${modelUrl}`);
    
    // Stop animation
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Disconnect resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // Dispose mesh and materials
    if (meshRef.current) {
      if (meshRef.current.geometry) {
        meshRef.current.geometry.dispose();
      }
      if (meshRef.current.material) {
        if (Array.isArray(meshRef.current.material)) {
          meshRef.current.material.forEach(material => material.dispose());
        } else {
          meshRef.current.material.dispose();
        }
      }
      meshRef.current = null;
    }

    // Dispose renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.forceContextLoss();
      rendererRef.current = null;
    }

    // Clear scene
    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }

    cameraRef.current = null;
  }, [modelUrl]);

  // Adaptive scale calculation for modal viewer
  const calculateAdaptiveScale = useCallback((modelSize: number): number => {
    // Adaptive scaling algorithm based on model dimensions for modal view
    
    if (modelSize <= 0) {
      console.warn('[Model3DViewer] Invalid model size, using default scale');
      return 2.0;
    }
    
    let scale: number;
    
    if (modelSize < 0.1) {
      // Very tiny models (< 0.1 units) - huge scale
      scale = 30.0;
    } else if (modelSize < 1.0) {
      // Small models (0.1 - 1 units) - large scale with smooth transition
      scale = 10.0 + (1.0 - modelSize) * 20.0; // 10-30 range
    } else if (modelSize < 10.0) {
      // Medium models (1 - 10 units) - moderate scale with smooth transition  
      scale = 2.0 + (10.0 - modelSize) / 9.0 * 8.0; // 2-10 range
    } else if (modelSize < 100.0) {
      // Large models (10 - 100 units) - smaller scale
      scale = 0.8 + (100.0 - modelSize) / 90.0 * 1.2; // 0.8-2 range
    } else {
      // Very large models (> 100 units) - minimal scale
      scale = Math.max(0.3, 80.0 / modelSize); // Minimum 0.3, scales down for very large models
    }
    
    // Ensure minimum visibility
    scale = Math.max(scale, 0.3);
    
    const category = modelSize < 0.1 ? 'very tiny' : 
                    modelSize < 1.0 ? 'small' :
                    modelSize < 10.0 ? 'medium' :
                    modelSize < 100.0 ? 'large' : 'very large';
                    
    console.log(`[Model3DViewer] Model category: ${category} (size: ${modelSize.toFixed(3)}) -> scale: ${scale.toFixed(3)}`);
    
    return scale;
  }, []);

  // Position camera optimally for scaled model
  const positionCameraForModel = useCallback((modelSize: THREE.Vector3, scale: number) => {
    if (!cameraRef.current) return;
    
    // Calculate scaled dimensions
    const scaledSize = modelSize.clone().multiplyScalar(scale);
    const maxScaledDimension = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);
    
    // Calculate optimal distance (significantly further for large scaled models)
    const distance = Math.max(maxScaledDimension * 1, 8); // Minimum distance of 8 units
    
    // Position camera for good viewing angle
    cameraRef.current.position.set(
      distance * 0.5,   // x: slightly to the side
      distance * 0.3,   // y: slightly elevated
      distance          // z: main viewing distance
    );
    
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix();
    
    console.log(`[Model3DViewer] Camera positioned at distance ${distance.toFixed(2)} for scaled model size ${maxScaledDimension.toFixed(2)}`);
  }, []);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!canvasRef.current || !mountRef.current) return;

    const canvas = canvasRef.current;
    const container = mountRef.current;
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width || width;
    const containerHeight = rect.height || height;

    console.log(`[Model3DViewer] Initializing scene for: ${modelUrl}`);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerWidth / containerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);
    cameraRef.current = camera;

    // Renderer - ensure canvas is not null
    if (!canvas) {
      console.error('[Model3DViewer] Canvas ref is null');
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    return { scene, camera, renderer };
  }, [modelUrl, width, height]);

  // Load STL model
  const loadModel = useCallback(async () => {
    if (!sceneRef.current) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`[Model3DViewer] Loading model: ${modelUrl}`);
      
      const stlLoader = new STLLoader();
      const geometry = await stlLoader.loadSTL(modelUrl);

      // Center and scale geometry
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      const center = box.getCenter(new THREE.Vector3());
      geometry.translate(-center.x, -center.y, -center.z);

      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      
      // Use adaptive scale calculation based on model size
      const scale = calculateAdaptiveScale(maxSize);
      
      console.log(`[Model3DViewer] Modal view - original size: ${maxSize.toFixed(3)}, calculated scale: ${scale.toFixed(3)}`);
      
      geometry.scale(scale, scale, scale);

      // Create material and mesh
      const material = new THREE.MeshLambertMaterial({
        color: 0x4a90e2,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Remove old mesh if exists
      if (meshRef.current && sceneRef.current) {
        sceneRef.current.remove(meshRef.current);
        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
        if (meshRef.current.material) {
          if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach(mat => mat.dispose());
          } else {
            meshRef.current.material.dispose();
          }
        }
      }

      meshRef.current = mesh;
      sceneRef.current.add(mesh);
      
      // Position camera optimally based on scaled model size
      positionCameraForModel(size, scale);
      
      setLoading(false);

      console.log(`[Model3DViewer] Model loaded successfully: ${modelUrl}`);
    } catch (err) {
      console.error('[Model3DViewer] Error loading model:', err);
      setError('Failed to load 3D model');
      setLoading(false);
    }
  }, [modelUrl, calculateAdaptiveScale, positionCameraForModel]);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
      return;
    }

    animationIdRef.current = requestAnimationFrame(animate);

    // Auto-rotate model
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  // Handle resize
  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (!entry || !rendererRef.current || !cameraRef.current) return;

    const { width: newWidth, height: newHeight } = entry.contentRect;
    
    if (newWidth > 0 && newHeight > 0) {
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
      
      console.log(`[Model3DViewer] Resized to: ${newWidth}x${newHeight}`);
    }
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    mouseRef.current.isDown = true;
    mouseRef.current.lastX = event.clientX;
    mouseRef.current.lastY = event.clientY;
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.isDown = false;
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!mouseRef.current.isDown || !meshRef.current) return;

    const deltaX = event.clientX - mouseRef.current.lastX;
    const deltaY = event.clientY - mouseRef.current.lastY;

    meshRef.current.rotation.y += deltaX * 0.01;
    meshRef.current.rotation.x += deltaY * 0.01;

    mouseRef.current.lastX = event.clientX;
    mouseRef.current.lastY = event.clientY;
  }, []);

  // Main effect - setup and cleanup
  useEffect(() => {
    // Small delay to ensure canvas is fully mounted
    const timeoutId = setTimeout(() => {
      if (!canvasRef.current || !mountRef.current) {
        console.warn('[Model3DViewer] Canvas or mount ref not ready');
        return;
      }

      console.log(`[Model3DViewer] Setting up for: ${modelUrl}`);

      // Initialize scene
      const result = initScene();
      if (!result) {
        console.error('[Model3DViewer] Failed to initialize scene');
        return;
      }

      // Setup resize observer
      if (window.ResizeObserver && mountRef.current) {
        resizeObserverRef.current = new ResizeObserver(handleResize);
        resizeObserverRef.current.observe(mountRef.current);
      }

      // Start animation
      animate();

      // Load model
      loadModel();
    }, 0);

    // Cleanup on unmount or modelUrl change
    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
  }, [modelUrl, initScene, loadModel, animate, handleResize, cleanup]);

  return (
    <div 
      ref={mountRef}
      className={`relative w-full h-full ${className}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-gray-600">Loading 3D model...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-75">
          <div className="text-red-600">{error}</div>
        </div>
      )}
    </div>
  );
}; 