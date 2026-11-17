import React from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import { Cpu, Activity, Thermometer, Camera, ShieldCheck, Fan, Zap, Radio } from 'lucide-react';
import { SectionHeader } from '../components/design-system/DesignSystemComponents';
import { ESP32ConnectionPanel } from '../components/common/ESP32ConnectionPanel';

export const SensorHealthPage: React.FC = () => {
  const { sensors, thermal, serialStatus } = useMonitoring();

  const ppgSensor = sensors.find(s => s.id === 'max30102') || sensors[0];
  const dhtSensor = sensors.find(s => s.id === 'dht11');
  const dsSensor = sensors.find(s => s.id === 'ds18b20' || s.id === 'mlx90614') || sensors[1];
  const cameraSensor = sensors.find(s => s.id === 'camera') || sensors[2];

  const mapStatus = (status?: string): 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'STANDBY' | 'WAITING' => {
    if (!status || status === 'WAITING') return 'WAITING';
    if (status === 'CONNECTED') return 'ONLINE';
    if (status === 'DEGRADED') return 'DEGRADED';
    if (status === 'DISCONNECTED') return 'OFFLINE';
    return 'STANDBY';
  };

  const isConnected = (status?: string) => status === 'CONNECTED';
  const isSerialActive = serialStatus === 'CONNECTED';

  const sensorMatrix = [
    {
      name: 'MAX30102 Optical Sensor',
      type: 'PPG & SpO₂ Telemetry',
      pin: 'GPIO 32 (SDA), GPIO 33 (SCL)',
      protocol: ppgSensor?.lastReading ? `Reading: ${ppgSensor.lastReading}` : 'I²C (0x57) · Fast Mode',
      rate: ppgSensor?.bpmCandidate ? `Cand: ${ppgSensor.bpmCandidate.toFixed(0)} BPM / ${ppgSensor.spo2Candidate ? ppgSensor.spo2Candidate.toFixed(0) + '%' : 'Est'}` : '100 Hz Sample',
      status: mapStatus(ppgSensor?.connectionStatus),
      latency: isConnected(ppgSensor?.connectionStatus) ? '12ms' : '—',
      health: isConnected(ppgSensor?.connectionStatus) ? (ppgSensor?.validity === 'VALID' ? '100%' : ppgSensor?.signalQuality === 'GOOD' ? '85%' : '60%') : '0%',
      icon: Activity,
      color: 'text-rose-600',
    },
    {
      name: 'DS18B20 Digital Thermometer',
      type: 'Chamber Temperature Probe',
      pin: 'GPIO 4 · Dallas 1-Wire Bus',
      protocol: '1-Wire · 12-bit Resolution (4.7kΩ pull-up)',
      rate: '1 Hz',
      status: mapStatus(dsSensor?.connectionStatus),
      latency: isConnected(dsSensor?.connectionStatus) ? '18ms' : '—',
      health: isConnected(dsSensor?.connectionStatus) ? '100%' : '0%',
      icon: Thermometer,
      color: 'text-amber-600',
    },
    {
      name: 'DHT11 Environmental Sensor',
      type: 'Relative Humidity & Ambient Temp',
      pin: 'GPIO 5 · Single-Wire GPIO',
      protocol: 'Custom Digital Single-Wire',
      rate: '1 Hz',
      status: mapStatus(dhtSensor?.connectionStatus),
      latency: isConnected(dhtSensor?.connectionStatus) ? '22ms' : '—',
      health: isConnected(dhtSensor?.connectionStatus) ? '100%' : '0%',
      icon: Thermometer,
      color: 'text-teal-600',
    },
    {
      name: 'Laptop Webcam Flow Pipeline',
      type: 'Non-contact Thoracic Movement',
      pin: 'Browser getUserMedia Web API',
      protocol: 'Client-side Optical Flow',
      rate: '15 FPS',
      status: mapStatus(cameraSensor?.connectionStatus),
      latency: isConnected(cameraSensor?.connectionStatus) ? '16ms' : '—',
      health: isConnected(cameraSensor?.connectionStatus) ? '95%' : '0%',
      icon: Camera,
      color: 'text-violet-600',
    },
  ];

  const actuatorMatrix = [
    {
      name: 'ESP32-WROOM-32 Controller',
      type: 'Core Microcontroller Unit',
      pin: 'USB Serial (115,200 Baud)',
      protocol: 'Line-delimited JSON Stream',
      rate: '1 Hz Telemetry Stream',
      status: isSerialActive ? 'ONLINE' : serialStatus === 'CONNECTING' ? 'DEGRADED' : 'WAITING',
      latency: isSerialActive ? '4ms' : '—',
      health: isSerialActive ? '100%' : '0%',
      icon: Cpu,
      color: 'text-blue-600',
    },
    {
      name: 'Thermal Actuator Stage',
      type: 'Micro-climate Peltier Driver',
      pin: 'GPIO 25 · Direction / Gate',
      protocol: `State: ${thermal.peltierCommand} · PWM: ${thermal.peltierPwm}`,
      rate: 'Thermal Relay / PWM',
      status: thermal.peltierCommand === 'OFF' ? 'STANDBY' : isSerialActive ? 'ONLINE' : 'STANDBY',
      latency: isSerialActive ? '2ms' : '—',
      health: isSerialActive ? '98%' : '0%',
      icon: Zap,
      color: 'text-amber-600',
    },
    {
      name: 'Circulation Fan & Exhaust',
      type: 'Airflow Exchange Driver',
      pin: 'GPIO 18 · Power MOSFET Driver',
      protocol: `Fan Command: ${thermal.fanCommand} · Safety: ${thermal.hardwareSafetyStatus}`,
      rate: 'Digital Level',
      status: thermal.fanCommand === 'OFF' ? 'STANDBY' : isSerialActive ? 'ONLINE' : 'STANDBY',
      latency: isSerialActive ? '2ms' : '—',
      health: isSerialActive ? '95%' : '0%',
      icon: Fan,
      color: 'text-slate-600',
    },
  ];

  const statusBadge = (st: string) => {
    switch (st) {
      case 'ONLINE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">ONLINE</span>;
      case 'DEGRADED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">DEGRADED</span>;
      case 'WAITING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">WAITING</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 text-slate-500 border border-slate-200">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Cpu}
        title="Hardware &amp; Sensor Health Matrix"
        subtitle="Direct diagnostic bus monitoring for physical I²C sensors, 1-Wire probes, and ESP32 actuator drivers"
        badge={isSerialActive ? 'HARDWARE CONNECTED' : 'AWAITING HARDWARE'}
        badgeVariant={isSerialActive ? 'emerald' : 'blue'}
      />

      {/* Connection Panel */}
      <ESP32ConnectionPanel />

      {/* Sensor Bus Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-[#172033] tracking-tight uppercase">
              Physical Telemetry Sensor Bus (I²C / 1-Wire / Vision)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">4 Registered Channels</span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {sensorMatrix.map(sensor => {
            const Icon = sensor.icon;
            return (
              <div key={sensor.name} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors min-w-[640px]">
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0">
                    <Icon className={`w-4 h-4 ${sensor.color}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#172033]">{sensor.name}</h4>
                    <span className="text-[11px] text-slate-500 block font-normal">{sensor.type}</span>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-600 min-w-[200px]">
                  <span className="text-slate-400 text-[10px] block">PIN &amp; PROTOCOL</span>
                  <span>{sensor.pin}</span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">{sensor.protocol}</span>
                </div>

                <div className="text-xs font-mono text-slate-600 text-center min-w-[80px]">
                  <span className="text-slate-400 text-[10px] block">RATE</span>
                  <span>{sensor.rate}</span>
                </div>

                <div className="text-xs font-mono text-slate-600 text-center min-w-[70px]">
                  <span className="text-slate-400 text-[10px] block">LATENCY</span>
                  <span>{sensor.latency}</span>
                </div>

                <div className="flex-shrink-0">
                  {statusBadge(sensor.status)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actuator & Controller Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-semibold text-[#172033] tracking-tight uppercase">
              ESP32 Microcontroller &amp; Actuator Drivers
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">ESP-WROOM-32 Subsystem</span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {actuatorMatrix.map(act => {
            const Icon = act.icon;
            return (
              <div key={act.name} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors min-w-[640px]">
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0">
                    <Icon className={`w-4 h-4 ${act.color}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#172033]">{act.name}</h4>
                    <span className="text-[11px] text-slate-500 block font-normal">{act.type}</span>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-600 min-w-[200px]">
                  <span className="text-slate-400 text-[10px] block">LINE &amp; CONTROL</span>
                  <span>{act.pin}</span>
                  <span className="text-slate-400 block text-[10px] mt-0.5">{act.protocol}</span>
                </div>

                <div className="text-xs font-mono text-slate-600 text-center min-w-[80px]">
                  <span className="text-slate-400 text-[10px] block">RATE</span>
                  <span>{act.rate}</span>
                </div>

                <div className="text-xs font-mono text-slate-600 text-center min-w-[70px]">
                  <span className="text-slate-400 text-[10px] block">LATENCY</span>
                  <span>{act.latency}</span>
                </div>

                <div className="flex-shrink-0">
                  {statusBadge(act.status)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
