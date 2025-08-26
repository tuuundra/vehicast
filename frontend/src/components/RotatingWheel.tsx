// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import { useGLTF, PresentationControls, Environment, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { Box } from '@chakra-ui/react';
import planetaryGearsModel from '../assets/planetary_gears.glb';

// Path to the planetary gears model
const modelPath = planetaryGearsModel;

export function GearModel(props: any) {
  const group = useRef<THREE.Group>(null);
  
  // Load the GLB model with animations
  const { scene, animations } = useGLTF(modelPath);
  
  // Access animations using useAnimations hook
  const { actions, names } = useAnimations(animations, group);
  
  // Clone the scene to avoid modifying the cached original
  const gearScene = React.useMemo(() => scene.clone(), [scene]);
  
  // Play animation on component mount
  useEffect(() => {
    // Log available animations to console for debugging
    console.log('Available animations:', names);
    
    // Play the first animation if available
    if (names.length > 0) {
      const animationName = names[0];
      console.log(`Playing animation: ${animationName}`);
      actions[animationName]?.play();
    } else {
      console.log('No animations found in the model');
    }
  }, [actions, names]);
  
  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={gearScene} />
    </group>
  );
}

export function RotatingWheel({ position = 'right', size = 300 }: { position?: 'left' | 'right', size?: number }) {
  // Calculate position based on left or right preference
  const positionStyle = position === 'left' 
    ? { left: '15%', top: '150px' } 
    : { right: '15%', top: '200px' }; // Adjusted top position
    
  return (
    <Box
      position="absolute"
      width={`${size + 200}px`}  // Even wider container
      height={`${size + 300}px`} // Even taller container
      zIndex={5}
      pointerEvents="none"
      overflow="visible"
      {...positionStyle}
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 30 }}  // Adjusted camera to accommodate larger wheel
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <GearModel rotation={[0.2, -0.1, 0]} position={[-2, -2, 0]} scale={7.0} />
        </PresentationControls>
        <Environment preset="sunset" />
      </Canvas>
    </Box>
  );
}

// Preload the model
useGLTF.preload(modelPath); 