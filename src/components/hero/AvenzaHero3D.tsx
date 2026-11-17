import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Line as DreiLine } from '@react-three/drei';
import * as THREE from 'three';

export interface SensorInfo {
  id: string;
  name: string;
  type: string;
  pin: string;
  protocol: string;
  specs: string;
  status: string;
  color: string;
  position: [number, number, number];
}

export const HARDWARE_MODULES: SensorInfo[] = [
  {
    id: 'esp32',
    name: 'ESP32-WROOM-32D',
    type: 'Core Microcontroller',
    pin: 'USB-UART Bridge',
    protocol: '115,200 Baud Serial',
    specs: 'Dual-core Xtensa 240MHz · 520KB SRAM · Web Serial Host',
    status: 'Ready for Connection',
    color: '#2563EB',
    position: [0, 0.15, 0],
  },
  {
    id: 'max30102',
    name: 'MAX30102 Pulse Oximeter',
    type: 'Optical PPG & SpO₂',
    pin: 'GPIO 21 (SDA), 22 (SCL)',
    protocol: 'I²C Fast Mode (400kHz)',
    specs: 'Dual Red & IR LEDs · 18-bit ADC · Uncalibrated Prototype',
    status: '100 Hz Sampling Active',
    color: '#E11D48',
    position: [1.8, 0.25, 0.4],
  },
  {
    id: 'ds18b20',
    name: 'DS18B20 Waterproof Probe',
    type: 'Chamber Temperature Sensor',
    pin: 'GPIO 4 (1-Wire Bus)',
    protocol: 'Dallas 1-Wire Protocol',
    specs: '±0.5°C Accuracy (-10°C to +85°C) · Stainless steel capsule',
    status: '12-bit Resolution (0.0625°C)',
    color: '#D97706',
    position: [-1.8, 0.35, -0.4],
  },
  {
    id: 'dht11',
    name: 'DHT11 Environmental Sensor',
    type: 'Relative Humidity & Temp',
    pin: 'GPIO 15 (Single Bus)',
    protocol: 'Custom Single-Wire Serial',
    specs: '20-90% RH (5% accuracy) · 0-50°C chamber tracking',
    status: '1 Hz Environmental Loop',
    color: '#0D9488',
    position: [-1.4, 0.28, 1.2],
  },
  {
    id: 'actuator',
    name: 'Thermal Actuator Stage',
    type: 'Micro-climate Actuator Driver',
    pin: 'GPIO 18 (PWM Output)',
    protocol: 'PWM Duty Cycle Control',
    specs: 'Finned aluminum dissipation stage · Actuator type: NOT CONFIRMED',
    status: 'Hardware Verification Stage',
    color: '#7C3AED',
    position: [1.5, 0.35, -1.0],
  },
];

/* ─── Physical ESP32 Board Model ─────────────────────────────── */
const ESP32BoardMesh: React.FC<{ isSelected: boolean; onSelect: () => void }> = ({ isSelected, onSelect }) => {
  return (
    <group position={[0, 0.12, 0]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* PCB substrate (Dark Matte Green) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.06, 1.2]} />
        <meshStandardMaterial color="#0f3b25" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Metal RF Shield Can (ESP-WROOM-32) */}
      <mesh position={[-0.25, 0.07, 0]} castShadow>
        <boxGeometry args={[0.9, 0.08, 0.9]} />
        <meshStandardMaterial color="#b8c0c8" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Antenna Trace Area */}
      <mesh position={[-0.8, 0.04, 0]}>
        <boxGeometry args={[0.2, 0.03, 0.8]} />
        <meshStandardMaterial color="#1a4c33" roughness={0.7} />
      </mesh>

      {/* USB-C Connector */}
      <mesh position={[0.92, 0.06, 0]}>
        <boxGeometry args={[0.18, 0.07, 0.3]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.15} metalness={0.95} />
      </mesh>

      {/* Silicon IC Chips */}
      <mesh position={[0.4, 0.06, -0.2]}>
        <boxGeometry args={[0.25, 0.04, 0.25]} />
        <meshStandardMaterial color="#18181b" roughness={0.5} />
      </mesh>
      <mesh position={[0.4, 0.06, 0.2]}>
        <boxGeometry args={[0.2, 0.04, 0.2]} />
        <meshStandardMaterial color="#18181b" roughness={0.5} />
      </mesh>

      {/* Header Pins Left & Right */}
      {[-0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7].map((x, i) => (
        <React.Fragment key={i}>
          <mesh position={[x, 0.08, -0.52]}>
            <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
          </mesh>
          <mesh position={[x, 0.08, 0.52]}>
            <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Flashing Blue Status LED */}
      <mesh position={[0.65, 0.07, -0.35]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#2563EB" emissive="#3B82F6" emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
};

/* ─── MAX30102 Breakout Board Model ──────────────────────────── */
const MAX30102Mesh: React.FC<{ isSelected: boolean; onSelect: () => void }> = ({ isSelected, onSelect }) => {
  return (
    <group position={[1.8, 0.2, 0.4]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Purple PCB */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.05, 0.65]} />
        <meshStandardMaterial color="#3b0764" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Sensor Metal Cap */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.4, 0.05, 0.3]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Red & IR Optical Windows */}
      <mesh position={[-0.08, 0.08, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.08, 0.08, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
        <meshStandardMaterial color="#881337" emissive="#be123c" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
};

/* ─── DS18B20 Steel Probe Model ──────────────────────────────── */
const DS18B20Mesh: React.FC<{ isSelected: boolean; onSelect: () => void }> = ({ isSelected, onSelect }) => {
  return (
    <group position={[-1.8, 0.25, -0.4]} rotation={[0, 0.3, Math.PI / 2]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Stainless Steel Probe Cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.1, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Probe Tip */}
      <mesh position={[0, -0.58, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Black Heatshrink Collar */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.25, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
    </group>
  );
};

/* ─── DHT11 Humidity Module Model ────────────────────────────── */
const DHT11Mesh: React.FC<{ isSelected: boolean; onSelect: () => void }> = ({ isSelected, onSelect }) => {
  return (
    <group position={[-1.4, 0.22, 1.2]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Blue Plastic Vented Enclosure */}
      <mesh castShadow>
        <boxGeometry args={[0.65, 0.4, 0.5]} />
        <meshStandardMaterial color="#0284c7" roughness={0.4} />
      </mesh>
      {/* Grill Vent Slots */}
      {[-0.15, -0.05, 0.05, 0.15].map((y, i) => (
        <mesh key={i} position={[0, y, 0.26]}>
          <boxGeometry args={[0.45, 0.03, 0.02]} />
          <meshStandardMaterial color="#0369a1" roughness={0.8} />
        </mesh>
      ))}
      {/* PCB base */}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.7, 0.04, 0.55]} />
        <meshStandardMaterial color="#0f3b25" roughness={0.5} />
      </mesh>
    </group>
  );
};

/* ─── Thermal Actuator Stage Model ───────────────────────────── */
const ActuatorStageMesh: React.FC<{ isSelected: boolean; onSelect: () => void }> = ({ isSelected, onSelect }) => {
  return (
    <group position={[1.5, 0.25, -1.0]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Aluminum Base Block */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.9, 0.1, 0.9]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Cooling Fins */}
      {[-0.35, -0.2, -0.05, 0.1, 0.25, 0.4].map((z, i) => (
        <mesh key={i} position={[0, 0.2, z]} castShadow>
          <boxGeometry args={[0.85, 0.3, 0.03]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* Shroud Cover Frame */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.92, 0.06, 0.92]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
    </group>
  );
};

/* ─── PCB Bus Wiring Lines Connecting Modules ────────────────── */
const BusTrace: React.FC<{ start: [number, number, number]; end: [number, number, number]; color: string; active: boolean }> = ({
  start,
  end,
  color,
  active,
}) => {
  const points: [number, number, number][] = [
    [start[0], 0.08, start[2]],
    [start[0] * 0.5, 0.08, end[2] * 0.5],
    [end[0], 0.08, end[2]],
  ];

  return (
    <DreiLine
      points={points}
      color={active ? color : '#cbd5e1'}
      lineWidth={active ? 2 : 1}
      transparent
      opacity={active ? 0.9 : 0.35}
    />
  );
};

/* ─── Interactive Hotspot Indicator ──────────────────────────── */
const HotspotBeacon: React.FC<{
  position: [number, number, number];
  color: string;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ position, color, isSelected, onSelect }) => {
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!beaconRef.current) return;
    const t = state.clock.getElapsedTime();
    beaconRef.current.position.y = position[1] + 0.35 + Math.sin(t * 3) * 0.04;
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh
        ref={beaconRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[isSelected ? 0.09 : 0.06, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 3 : 1.2}
          roughness={0.1}
        />
      </mesh>
      {/* Ground projection ring */}
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.15, 24]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.8 : 0.25} />
      </mesh>
    </group>
  );
};

/* ─── Main 3D Canvas Assembly ────────────────────────────────── */
export const AvenzaHero3D: React.FC<{
  onSelectModule?: (mod: SensorInfo | null) => void;
  selectedId?: string | null;
}> = ({ onSelectModule, selectedId: controlledSelectedId }) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>('esp32');
  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;

  const handleSelect = (id: string) => {
    const next = selectedId === id ? null : id;
    setInternalSelectedId(next);
    const mod = HARDWARE_MODULES.find(m => m.id === next) || null;
    onSelectModule?.(mod);
  };

  const activeModule = HARDWARE_MODULES.find(m => m.id === selectedId);

  return (
    <div className="relative w-full h-full min-h-[380px] md:min-h-[440px] select-none overflow-hidden bg-[#F8FAFC]">
      
      {/* Canvas Viewport */}
      <Canvas
        shadows
        camera={{ position: [3.8, 3.2, 4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#F8FAFC']} />

        {/* Studio Lighting Hierarchy */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[6, 9, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#93C5FD" />
        <pointLight position={[0, 2, 0]} intensity={0.4} color="#FFFFFF" />

        <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
          {/* Baseplate / Anodized Aluminum Chassis */}
          <group position={[0, -0.05, 0]}>
            <mesh receiveShadow position={[0, 0.02, 0]}>
              <boxGeometry args={[4.8, 0.08, 3.4]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.5} />
            </mesh>
            {/* Rubber Feet Stand-offs */}
            {[[-2.2, -1.5], [2.2, -1.5], [-2.2, 1.5], [2.2, 1.5]].map(([x, z], i) => (
              <mesh key={i} position={[x, -0.05, z]}>
                <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
                <meshStandardMaterial color="#1e293b" roughness={0.8} />
              </mesh>
            ))}
          </group>

          {/* Core Hardware Modules */}
          <ESP32BoardMesh isSelected={selectedId === 'esp32'} onSelect={() => handleSelect('esp32')} />
          <MAX30102Mesh isSelected={selectedId === 'max30102'} onSelect={() => handleSelect('max30102')} />
          <DS18B20Mesh isSelected={selectedId === 'ds18b20'} onSelect={() => handleSelect('ds18b20')} />
          <DHT11Mesh isSelected={selectedId === 'dht11'} onSelect={() => handleSelect('dht11')} />
          <ActuatorStageMesh isSelected={selectedId === 'actuator'} onSelect={() => handleSelect('actuator')} />

          {/* PCB Wiring Traces between sensors & ESP32 */}
          {HARDWARE_MODULES.filter(m => m.id !== 'esp32').map(m => (
            <BusTrace
              key={m.id}
              start={[0, 0, 0]}
              end={m.position}
              color={m.color}
              active={selectedId === m.id}
            />
          ))}

          {/* Interactive Beacons */}
          {HARDWARE_MODULES.map(m => (
            <HotspotBeacon
              key={m.id}
              position={m.position}
              color={m.color}
              isSelected={selectedId === m.id}
              onSelect={() => handleSelect(m.id)}
            />
          ))}
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.3}
          minPolarAngle={Math.PI / 4.5}
          autoRotate={!selectedId}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export const NeoNattleHero3D = AvenzaHero3D;
export default AvenzaHero3D;
