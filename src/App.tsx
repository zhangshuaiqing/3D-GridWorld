import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import { useStore } from './store';
import Grid from './components/Grid';
import Agent from './components/Agent';
import Goal from './components/Goal';
import Obstacles from './components/Obstacles';
import DynamicObstacle from './components/DynamicObstacle';
import ControlPanel from './panels/ControlPanel';
import StatusPanel from './panels/StatusPanel';
import LegendPanel from './panels/LegendPanel';
import SettingsPanel from './panels/SettingsPanel';
import ObservationPanel from './panels/ObservationPanel';
import type { ObservationMode } from './types';

function WebGLCheck() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    setSupported(!!gl);
  }, []);

  if (supported === false) {
    return (
      <div className="webgl-fallback">
        <h2>WebGL 不可用</h2>
        <p>您的浏览器不支持 WebGL，无法渲染 3D 场景。</p>
        <p>请尝试使用 Chrome / Firefox / Edge 最新版本，并开启硬件加速。</p>
      </div>
    );
  }

  return null;
}

export default function App() {
  const config = useStore((s) => s.config);

  useControls('GridWorld', {
    size: {
      value: config.size, min: 4, max: 20, step: 1,
      onChange: (v: number) => { useStore.getState().setSize(v); },
    },
    obstacles: {
      value: config.obstacleRatio, min: 0, max: 0.5, step: 0.05,
      onChange: (v: number) => { useStore.getState().setObstacleRatio(v); },
    },
    mode: {
      value: config.observationMode,
      options: ['full', 'local', 'fog_of_war'] as ObservationMode[],
      onChange: (v: ObservationMode) => { useStore.getState().setObservationMode(v); },
    },
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#0d1117' }}>
      <WebGLCheck />

      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        gl={{
          antialias: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
          premultipliedAlpha: false,
          alpha: false,
        }}
        onCreated={({ gl }) => { gl.setClearColor('#0d1117'); }}
        style={{ width: '100%', height: '100%' }}
        fallback={
          <div className="webgl-fallback">
            <h2>WebGL 初始化失败</h2>
            <p>无法创建 3D 渲染上下文。</p>
          </div>
        }
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} />
        <directionalLight position={[-5, 10, -5]} intensity={0.3} />
        <Grid />
        <Obstacles />
        <Agent />
        <Goal />
        <DynamicObstacle />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={3}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>

      <ControlPanel />
      <StatusPanel />
      <ObservationPanel />
      <LegendPanel />
      <SettingsPanel />

      <Leva collapsed titleBar={{ title: 'Debug' }} />
    </div>
  );
}
