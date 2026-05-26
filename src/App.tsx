import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import { useStore } from './store';
import Grid from './components/Grid';
import Agent from './components/Agent';
import Goal from './components/Goal';
import DynamicObstacle from './components/DynamicObstacle';
import ControlPanel from './panels/ControlPanel';
import StatusPanel from './panels/StatusPanel';
import LegendPanel from './panels/LegendPanel';
import SettingsPanel from './panels/SettingsPanel';
import type { ObservationMode } from './types';

export default function App() {
  const config = useStore((s) => s.config);

  // leva controls for quick debugging
  useControls('GridWorld', {
    size: { value: config.size, min: 4, max: 20, step: 1, onChange: (v: number) => useStore.getState().setSize(v) },
    obstacles: { value: config.obstacleRatio, min: 0, max: 0.5, step: 0.05, onChange: (v: number) => useStore.getState().setObstacleRatio(v) },
    mode: {
      value: config.observationMode,
      options: ['full', 'local', 'fog_of_war'] as ObservationMode[],
      onChange: (v: ObservationMode) => useStore.getState().setObservationMode(v),
    },
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#0d1117' }}>
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        gl={{ antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 15, 10]} intensity={1} />
        <directionalLight position={[-5, 10, -5]} intensity={0.3} />
        <Grid />
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
        <Stats />
      </Canvas>

      {/* UI Panels */}
      <ControlPanel />
      <StatusPanel />
      <LegendPanel />
      <SettingsPanel />

      {/* Leva Debug Panel */}
      <Leva collapsed titleBar={{ title: 'Debug' }} />
    </div>
  );
}
