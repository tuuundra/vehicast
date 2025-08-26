import * as THREE from 'three';
import { ReactThreeFiber } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>;
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
      primitive: { object: any } & ReactThreeFiber.Object3DNode<THREE.Object3D, typeof THREE.Object3D>;
      spotLight: ReactThreeFiber.LightNode<THREE.SpotLight, typeof THREE.SpotLight>;
      ambientLight: ReactThreeFiber.LightNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      directionalLight: ReactThreeFiber.LightNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
      pointLight: ReactThreeFiber.LightNode<THREE.PointLight, typeof THREE.PointLight>;
      hemisphereLight: ReactThreeFiber.LightNode<THREE.HemisphereLight, typeof THREE.HemisphereLight>;
      rectAreaLight: ReactThreeFiber.LightNode<THREE.RectAreaLight, typeof THREE.RectAreaLight>;
    }
  }
} 