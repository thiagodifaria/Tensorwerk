'use client';

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';

interface MarketDataPoint {
  timestamp: number;
  symbol: string;
  price: number;
  volume: number;
  curvature: number;
  liquidity: number;
}

interface RiemannManifoldProps {
  dataStreamUrl?: string;
  resolution?: number;
  curvatureScale?: number;
  showWireframe?: boolean;
  animationSpeed?: number;
}

const RiemannShaderMaterial = ({
  curvatureScale = 2.0,
  liquidityThreshold = 0.95,
  time = 0
}: {
  curvatureScale: number;
  liquidityThreshold: number;
  time: number;
}) => {
  const material = useMemo(() => {
    const vertexShader = `
      uniform float uTime;
      uniform float uCurvatureScale;
      uniform sampler2D uCurvatureTexture;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vCurvature;

      void main() {
        vUv = uv;
        vNormal = normal;

        float curvature = texture2D(uCurvatureTexture, uv).r;
        vCurvature = curvature;

        vec3 displacedPosition = position + normal * curvature * uCurvatureScale;
        vPosition = displacedPosition;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform float uLiquidityThreshold;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vCurvature;

      void main() {
        vec3 baseColor;

        if (vCurvature > uLiquidityThreshold) {
          baseColor = vec3(0.6, 0.2, 0.8);
        } else {
          float t = vCurvature / uLiquidityThreshold;
          baseColor = mix(
            vec3(0.0, 0.3, 0.8),
            mix(vec3(0.0, 0.8, 0.4), vec3(0.9, 0.2, 0.1), t * 2.0),
            t
          );
        }

        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diff = max(dot(vNormal, lightDir), 0.0);
        vec3 litColor = baseColor * (0.3 + 0.7 * diff);

        if (vCurvature > uLiquidityThreshold) {
          float pulse = sin(uTime * 8.0) * 0.5 + 0.5;
          litColor += vec3(0.3) * pulse;
        }

        gl_FragColor = vec4(litColor, 1.0);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uCurvatureScale: { value: curvatureScale },
        uLiquidityThreshold: { value: liquidityThreshold },
        uCurvatureTexture: { value: null }
      },
      side: THREE.DoubleSide,
      wireframe: false
    });
  }, [curvatureScale, liquidityThreshold]);

  useFrame((state: any) => {
    material.uniforms.uTime.value = state.clock.elapsedTime * time;
  });

  return material;
};

const RiemannMesh = ({
  resolution = 128,
  curvatureScale = 2.0
}: {
  resolution: number;
  curvatureScale: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [curvatureData, setCurvatureData] = useState<Float32Array>();

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 10, resolution, resolution);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [resolution]);

  // Synthetic curvature data (two gravitational wells)
  useEffect(() => {
    const data = new Float32Array(resolution * resolution * 4);

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const idx = (i * resolution + j) * 4;
        const x = (i / resolution) * 2 - 1;
        const y = (j / resolution) * 2 - 1;

        const d1 = Math.sqrt((x - 0.3) ** 2 + (y - 0.2) ** 2);
        const d2 = Math.sqrt((x + 0.4) ** 2 + (y + 0.3) ** 2);
        const curvature = 0.8 * Math.exp(-d1 * 3) + 0.6 * Math.exp(-d2 * 2)
          + 0.1 * Math.sin(x * 5) * Math.cos(y * 5);

        data[idx] = curvature;
        data[idx + 1] = curvature;
        data[idx + 2] = curvature;
        data[idx + 3] = 1.0;
      }
    }

    setCurvatureData(data);
  }, [resolution]);

  const curvatureTexture = useMemo(() => {
    if (!curvatureData) return null;
    const texture = new THREE.DataTexture(
      curvatureData, resolution, resolution, THREE.RGBAFormat, THREE.FloatType
    );
    texture.needsUpdate = true;
    return texture;
  }, [curvatureData, resolution]);

  const material = RiemannShaderMaterial({
    curvatureScale, liquidityThreshold: 0.95, time: 1.0
  });

  useEffect(() => {
    if (material.uniforms.uCurvatureTexture && curvatureTexture) {
      material.uniforms.uCurvatureTexture.value = curvatureTexture;
    }
  }, [material, curvatureTexture]);

  useFrame((state: any) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material}>
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const GeodesicGrid = ({ spacing = 1.0, size = 10 }: { spacing: number; size: number }) => {
  const gridRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: 0x4444ff, transparent: true, opacity: 0.3
    });

    for (let x = -size; x <= size; x += spacing) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, -size), new THREE.Vector3(x, 0, size)
      ]);
      group.add(new THREE.Line(geo, material));
    }

    for (let z = -size; z <= size; z += spacing) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size, 0, z), new THREE.Vector3(size, 0, z)
      ]);
      group.add(new THREE.Line(geo, material));
    }

    return group;
  }, [spacing, size]);

  return <primitive ref={gridRef} object={lines} />;
};

export const RiemannManifoldViewer: React.FC<RiemannManifoldProps> = ({
  dataStreamUrl,
  resolution = 128,
  curvatureScale = 2.0,
  showWireframe = false,
  animationSpeed = 1.0
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!dataStreamUrl) return;

    socketRef.current = io(dataStreamUrl, {
      transports: ['websocket'], reconnection: true
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));

    return () => { socketRef.current?.disconnect(); };
  }, [dataStreamUrl]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 10,
        color: '#00ff00', fontFamily: 'monospace', fontSize: '14px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '10px', borderRadius: '5px'
      }}>
        <div>STATUS: {isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}</div>
        <div>RESOLUTION: {resolution}×{resolution}</div>
        <div>SCALE: {curvatureScale.toFixed(2)}×</div>
      </div>

      <Canvas
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={60} near={0.1} far={1000} />
        <OrbitControls
          enableDamping dampingFactor={0.05} rotateSpeed={0.5}
          zoomSpeed={0.8} minDistance={2} maxDistance={20} maxPolarAngle={Math.PI / 2}
        />
        <Environment preset="night" />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <RiemannMesh resolution={resolution} curvatureScale={curvatureScale} />
        {showWireframe && <GeodesicGrid spacing={0.5} size={10} />}
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
};

export default RiemannManifoldViewer;
