import React from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { Cpu, Activity, Thermometer, Camera, ShieldCheck, Fan, Zap } from 'lucide-react';
import { SectionHeader, SensorHealthRow, ClinicalDisclaimer } from '../components/design-system/DesignSystemComponents';
import { ESP32ConnectionPanel } from '../components/common/ESP32ConnectionPanel';

export const SensorHealthPage: React.FC = () => {
  const { sensors, thermal, serialStatus } = useMonitoring();

  // Find sensors
  const ppgSensor = sensors.find(s => s.id === 'max30102') || sensors[0];
  const dhtSensor = sensors.find(s => s.id === 'dht11');
  const dsSensor = sensors.find(s => s.id === 'ds18b20' || s.id === 'mlx90614') || sensors[1];
  const cameraSensor = sensors.find(s => s.id === 'camera') || sensors[2];

  const mapStatus = (status?: string): 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'STANDBY' | 'WAITING' | 'UNAVAILABLE' => {
    if (!status || status === 'WAITING') return 'WAITING';
    if (status === 'UNAVAILABLE') return 'UNAVAILABLE';
    if (status === 'CONNECTED') return 'ONLINE';
    if (status === 'DEGRADED') return 'DEGRADED';
    if (status === 'DISCONNECTED') return 'OFFLINE';
    return 'STANDBY';
  };

  const isConnected = (status?: string) => status === 'CONNECTED';
  const isSerialActive = serialStatus === 'CONNECTED';

  const clinicalSensors = [
    {
      name: 'MAX30102 Optical PPG & Pulse Rate',
      protocol: 'I²C (0x57) · High-Rate Optical FIFO · SpO₂ Uncalibrated',
      status: mapStatus(ppgSensor?.connectionStatus),
      latencyMs: isConnected(ppgSensor?.connectionStatus) ? 14 : undefined,
      healthPct: isConnected(ppgSensor?.connectionStatus) ? (ppgSensor?.signalQuality === 'GOOD' ? 98 : ppgSensor?.signalQuality === 'FAIR' ? 76 : 35) : 0,
      icon: Activity,
    },
    {
      name: 'DS18B20 Incubator Chamber Temperature Probe',
      protocol: '1-Wire (GPIO 5) · Non-blocking async conversion · 1000ms',
      status: mapStatus(dsSensor?.connectionStatus),
      latencyMs: isConnected(dsSensor?.connectionStatus) ? 18 : undefined,
      healthPct: isConnected(dsSensor?.connectionStatus) ? 99 : 0,
      icon: Thermometer,
    },
    {
      name: 'DHT11 Ambient Temperature & Humidity Sensor',
      protocol: 'Single-Bus (GPIO 4) · 2000ms sampling cycle',
      status: mapStatus(dhtSensor?.connectionStatus),
      latencyMs: isConnected(dhtSensor?.connectionStatus) ? 20 : undefined,
      healthPct: isConnected(dhtSensor?.connectionStatus) ? 95 : 0,
      icon: Thermometer,
    },
    {
      name: 'Laptop Webcam (Thoracic Motion ROI)',
      protocol: 'Browser getUserMedia · 15 FPS Optical Motion Pipeline',
      status: mapStatus(cameraSensor?.connectionStatus),
      latencyMs: isConnected(cameraSensor?.connectionStatus) ? 16 : undefined,
      healthPct: isConnected(cameraSensor?.connectionStatus) ? 92 : 0,
      icon: Camera,
    },
  ];

  const hardwareActuators = [
    {
      name: 'ESP32 Dual-Core MCU (USB Web Serial)',
      protocol: 'Firmware v1.0.0 · 115,200 Baud JSON-lines',
      status: (serialStatus === 'CONNECTED' ? 'ONLINE' : serialStatus === 'CONNECTING' ? 'DEGRADED' : 'WAITING') as 'ONLINE' | 'DEGRADED' | 'WAITING',
      latencyMs: isSerialActive ? 4 : undefined,
      healthPct: isSerialActive ? 100 : 0,
      icon: Cpu,
    },
    {
      name: 'L298N Dual H-Bridge Driver (TEC1-12706 Peltier)',
      protocol: `PWM Output (GPIO 25, 26, 27) · State: ${thermal.peltierCommand}`,
      status: (thermal.peltierCommand === 'OFF' ? 'STANDBY' : isSerialActive ? 'ONLINE' : 'STANDBY') as 'ONLINE' | 'STANDBY',
      latencyMs: isSerialActive ? 2 : undefined,
      healthPct: isSerialActive ? 96 : 0,
      icon: Zap,
    },
    {
      name: 'Optocoupler Safety Relay Interlock (Fan)',
      protocol: `Digital Output (GPIO 18) · Interlock Status: ${thermal.hardwareSafetyStatus}`,
      status: (thermal.hardwareSafetyStatus === 'READY' ? 'ONLINE' : thermal.hardwareSafetyStatus === 'UNVERIFIED' ? 'WAITING' : 'DEGRADED') as 'ONLINE' | 'DEGRADED' | 'WAITING',
      latencyMs: isSerialActive ? 1 : undefined,
      healthPct: thermal.hardwareSafetyStatus === 'READY' ? 100 : thermal.hardwareSafetyStatus === 'UNVERIFIED' ? 0 : 40,
      icon: ShieldCheck,
    },
    {
      name: '12V DC Micro-Climate Circulation Fan',
      protocol: `Speed Command: ${thermal.fanCommand}`,
      status: (thermal.fanCommand === 'OFF' ? 'STANDBY' : isSerialActive ? 'ONLINE' : 'STANDBY') as 'ONLINE' | 'STANDBY',
      latencyMs: isSerialActive ? 2 : undefined,
      healthPct: isSerialActive ? 95 : 0,
      icon: Fan,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        icon={Cpu}
        title="Hardware & Sensor Diagnostic Matrix"
        subtitle="Separated clinical telemetry sensor health from ESP32 actuator hardware diagnostics"
        badge={isSerialActive ? 'ESP32 ONLINE' : 'WAITING FOR HARDWARE'}
        badgeVariant={isSerialActive ? 'emerald' : 'cyan'}
      />

      {/* USB Web Serial Connection Control Panel */}
      <ESP32ConnectionPanel />

      {/* Tier 1: Clinical Telemetry Sensors */}
      <div className="bg-surface-1 border border-line-0 rounded-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-line-0 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-medical-cyan" />
            <h3 className="text-sm font-sans font-bold text-slate-100">Tier 1 — Clinical Telemetry Sensing</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">4 CHANNELS</span>
        </div>

        <div className="space-y-3">
          {clinicalSensors.map(sensor => (
            <SensorHealthRow key={sensor.name} {...sensor} />
          ))}
        </div>
      </div>

      {/* Tier 2: ESP32 Hardware & Actuators */}
      <div className="bg-surface-1 border border-line-0 rounded-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-line-0 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-sans font-bold text-slate-100">Tier 2 — ESP32 Microcontroller & Actuators</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">ESP-WROOM-32</span>
        </div>

        <div className="space-y-3">
          {hardwareActuators.map(actuator => (
            <SensorHealthRow key={actuator.name} {...actuator} />
          ))}
        </div>
      </div>

      {/* Firmware & Protocol Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-0 border border-line-0 rounded-card text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>Firmware: <strong className="text-medical-cyan font-bold">AVENZA-ESP32-v1.0.0</strong></span>
          <span className="text-line-0">|</span>
          <span>Baud: <strong className="text-slate-200">115,200</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Protocol: <strong className="text-slate-400">5 Hz JSON-lines over USB</strong></span>
          <span className="text-line-0">|</span>
          <span>Shield: <strong className="text-violet-400">Active</strong></span>
        </div>
      </div>

      <ClinicalDisclaimer compact />
    </div>
  );
};
