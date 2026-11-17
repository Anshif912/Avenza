import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMonitoring } from '../context/MonitoringContext';
import {
  Thermometer, Activity, Heart, Gauge, ShieldAlert, Cpu,
  ArrowRight, Clock, CheckCircle2, AlertCircle, Droplets, Fan,
  Sliders, Wifi
} from 'lucide-react';
import { SignalQualityBadge, DataSourceBadge } from '../components/design-system/DesignSystemComponents';
import { ESP32IoTConsole } from '../components/iot/ESP32IoTConsole';

export const DashboardPage: React.FC = () => {
  const {
    vitals,
    thermal,
    sensors,
    alerts,
    serialStatus,
    httpStatus,
    isDemoMode
  } = useMonitoring();

  const [activeView, setActiveView] = useState<'overview' | 'iot'>('overview');
  const isConnected = serialStatus === 'CONNECTED' || httpStatus === 'CONNECTED';
  const recentAlerts = alerts.slice(0, 3);
  const unackCount = alerts.filter(a => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'WARNING')).length;

  const getSensorStatus = (id: string) => {
    const s = sensors.find(item => item.id === id || item.name.toLowerCase().includes(id.toLowerCase()));
    if (!s) return { status: 'STANDBY', online: false };
    return {
      status: s.connectionStatus,
      online: s.connectionStatus === 'CONNECTED'
    };
  };

  const esp32 = getSensorStatus('esp32');
  const dht11 = getSensorStatus('dht11');
  const ds18b20 = getSensorStatus('ds18b20');
  const max30102 = getSensorStatus('max30102');
  const camera = getSensorStatus('camera');
  const activeSensorsCount = [esp32.online, dht11.online, ds18b20.online, max30102.online, camera.online].filter(Boolean).length;

  return (
    <div className="space-y-6">

      {/* ─── 00. QUIET PROTOTYPE DISCLAIMER BANNER ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#172033] flex items-center gap-2">
              <span>Research Evaluation Platform</span>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-bold">
                PROTOTYPE v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Not cleared for clinical diagnostic or life-critical decision making. MAX30102 calibration is provisional.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            isConnected ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isConnected ? 'ESP32 Streaming' : isDemoMode ? 'Simulated Telemetry' : 'Hardware Idle'}
          </span>
        </div>
      </div>

      {/* ─── WORKSPACE VIEW TOGGLE (Overview vs IoT Hardware Console) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            System Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveView('iot')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'iot'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ESP32 IoT Console & Controls</span>
            {httpStatus === 'CONNECTED' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            )}
          </button>
        </div>

        <Link
          to="/iot"
          className="text-xs font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
        >
          <span>Dedicated IoT View →</span>
        </Link>
      </div>

      {activeView === 'iot' ? (
        <ESP32IoTConsole />
      ) : (
        <>
      {/* ─── 01. ENVIRONMENTAL MICRO-CLIMATE (Horizontal Reading & Datum) ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Thermometer className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
              Environmental Micro-Climate
            </h2>
          </div>
          <Link
            to="/environment"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <span>Environmental Controls</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chamber Temperature */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-600">Chamber Probe</span>
              <span className="text-[10px] font-mono text-slate-400">DS18B20</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-semibold text-[#172033] font-mono tabular-nums">
                {thermal.chamberTemp !== null ? thermal.chamberTemp.toFixed(1) : '—'}
              </span>
              <span className="text-sm font-sans text-slate-500">°C</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 pt-1 flex items-center justify-between">
              <span>Target Setpoint: {thermal.targetTemp.toFixed(1)}°C</span>
              <DataSourceBadge source={isConnected ? "MEASURED" : "SIMULATED"} />
            </div>
          </div>

          {/* Ambient Air Temp */}
          <div className="space-y-1.5 md:border-l md:border-slate-100 md:pl-6">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-600">Ambient Air Temp</span>
              <span className="text-[10px] font-mono text-slate-400">DHT11</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-semibold text-[#172033] font-mono tabular-nums">
                {sensors.find(s => s.id === 'dht11')?.validity === 'VALID'
                  ? sensors.find(s => s.id === 'dht11')?.lastReading.split(',')[0].replace('°C', '').trim()
                  : '—'}
              </span>
              <span className="text-sm font-sans text-slate-500">°C</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 pt-1 flex items-center justify-between">
              <span>Single-Bus GPIO 5</span>
              <span className="text-[10px] text-slate-400">{dht11.online ? 'Active' : 'Standby'}</span>
            </div>
          </div>

          {/* Relative Humidity */}
          <div className="space-y-1.5 md:border-l md:border-slate-100 md:pl-6">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-600">Relative Humidity</span>
              <span className="text-[10px] font-mono text-slate-400">DHT11</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-semibold text-blue-700 font-mono tabular-nums">
                {thermal.humidity !== null ? thermal.humidity : '—'}
              </span>
              <span className="text-sm font-sans text-slate-500">% RH</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 pt-1 flex items-center justify-between">
              <span>Chamber Equilibrium</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Nominal</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 02 & 03: PHYSIOLOGY & ACTUATION (Asymmetric 2-Column Workspace) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 02. Physiological Signals (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
                Physiological Telemetry
              </h2>
            </div>
            <Link
              to="/live-monitoring"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>Signal Streams</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Heart Rate */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Heart Rate</span>
                </span>
                <SignalQualityBadge quality={vitals.signalQuality} showLabel={false} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-[#172033] font-mono tabular-nums">
                  {vitals.heartRate !== null ? vitals.heartRate.toFixed(0) : '—'}
                </span>
                <span className="text-xs text-slate-500 font-sans">BPM</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span>MAX30102 FIFO 50Hz</span>
                <span className="text-[10px] text-slate-500 font-semibold">{vitals.signalQuality}</span>
              </div>
            </div>

            {/* SpO2 Saturation */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>SpO₂ Saturation</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  Uncalibrated
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-blue-700 font-mono tabular-nums">
                  {vitals.spo2 !== null ? vitals.spo2.toFixed(0) : '—'}
                </span>
                <span className="text-xs text-slate-500 font-sans">%</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span>Red/IR Ratio Metric</span>
                <span className="text-[10px] text-slate-500 font-semibold">Optical PPG</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Stream Latency: <strong className="text-slate-700">{vitals.dataAgeSeconds > 0 ? `${vitals.dataAgeSeconds.toFixed(1)}s` : 'Real-time'}</strong>
            </span>
            <span>Non-clinical research evaluation</span>
          </div>
        </div>

        {/* 03. Actuator State & Safety Strip (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Gauge className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
                Actuator Drivers
              </h2>
            </div>
            <Link
              to="/environment"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>Controls</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Circulation Fan */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                  <Fan className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-800 block">Circulation Fan</span>
                  <span className="text-[10px] font-mono text-slate-500">Chamber Air Flow</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${
                thermal.fanCommand === 'HIGH' || thermal.fanCommand === 'LOW'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-200/60 text-slate-600'
              }`}>
                {thermal.fanCommand}
              </span>
            </div>

            {/* Thermal Actuator Stage */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-800 block">Thermal Actuator</span>
                  <span className="text-[10px] font-mono text-slate-500">Peltier / Heat Stage</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${
                thermal.peltierCommand === 'HEATING'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : thermal.peltierCommand === 'COOLING'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-200/60 text-slate-600'
              }`}>
                {thermal.peltierCommand}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-xs font-mono text-slate-600 flex items-center justify-between">
            <span>Safety Interlock:</span>
            <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {thermal.hardwareSafetyStatus}
            </span>
          </div>
        </div>

      </div>

      {/* ─── 04 & 05: RECENT EVENTS & HARDWARE DIAGNOSTICS (2-Column Workspace) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 04. Recent Event Candidates (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
                Recent Incident Records
              </h2>
            </div>
            <Link
              to="/event-review"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>Triage Inbox ({unackCount})</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-sans">
              No recent incident records logged in this session.
            </div>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-500 animate-pulse' :
                      alert.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="truncate">
                      <span className="text-xs font-semibold text-[#172033] block truncate">
                        {alert.type}
                      </span>
                      <span className="text-[11px] text-slate-500 font-sans truncate block">
                        {alert.evidenceSummary}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">
                      {alert.timestamp.split('T')[1]?.split('.')[0] || alert.timestamp}
                    </span>
                    <Link
                      to="/event-review"
                      className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded text-[11px] font-medium transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 05. System Health Summary (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
                Telemetry Diagnostics
              </h2>
            </div>
            <Link
              to="/device-health"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {[
              { label: 'ESP32 Microcontroller', status: esp32.status, ok: esp32.online },
              { label: 'MAX30102 Optical Sensor', status: max30102.status, ok: max30102.online },
              { label: 'DS18B20 Temp Probe', status: ds18b20.status, ok: ds18b20.online },
              { label: 'DHT11 Humidity Sensor', status: dht11.status, ok: dht11.online },
              { label: 'Webcam Respiratory Flow', status: camera.status, ok: camera.online },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-600 font-sans">{item.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  item.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Active Channels: <strong className="text-slate-800">{activeSensorsCount} / 5</strong></span>
            <Link to="/device-health" className="text-blue-600 hover:underline">
              Sensor Matrix →
            </Link>
          </div>
        </div>

      </div>
      </>
      )}

    </div>
  );
};

export default DashboardPage;
