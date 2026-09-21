import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const GridPlane = () => {
  const meshRef = useRef();
  const { mouse, viewport } = useThree();

  const geometry = useMemo(() => {
    // Large plane to cover the entire screen
    const geo = new THREE.PlaneGeometry(160, 160, 80, 80);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position;
    
    // Mouse mapped to z=0 world coordinates
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseY = (mouse.y * viewport.height) / 2;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      const dx = x - mouseX;
      const dy = y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Base gentle wave
      let z = Math.sin(x * 0.2 + time) * 0.5 + Math.cos(y * 0.2 + time) * 0.5;
      
      // Mouse interaction (repel/pull)
      if (dist < 15) {
        z += (15 - dist) * 0.5;
      }
      
      positions.setZ(i, z);
    }
    positions.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} geometry={geometry}>
      <meshBasicMaterial color="#00d2ff" wireframe={true} transparent opacity={0.15} />
    </mesh>
  );
};

const InteractiveBackground = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, background: 'transparent' }}>
      <Canvas camera={{ position: [0, 0, 30], fov: 75 }}>
        <GridPlane />
      </Canvas>
    </div>
  );
};

export default InteractiveBackground;
