import { useStore } from '../store';

export default function Cursor() {
  const editMode = useStore((s) => s.editMode);
  const cursor = useStore((s) => s.cursor);

  if (!editMode) return null;

  return (
    <mesh position={[cursor[0], cursor[1] + 0.5, cursor[2]]}>
      <boxGeometry args={[1.05, 1.05, 1.05]} />
      <meshBasicMaterial
        color="#3fb950"
        transparent
        opacity={0.35}
        wireframe
      />
    </mesh>
  );
}
