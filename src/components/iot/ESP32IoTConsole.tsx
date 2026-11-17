import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Thermometer,
  Wind,
  Zap,
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Settings,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Send,
  Eye,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import { useMonitoring } from '../../context/MonitoringContext';
import { ESP32ControlCommand, PrototypeEvent, esp32HttpService } from '../../services/ESP32HttpService';

export const ESP32IoTConsole: React.FC = () => {
  const {
    httpStatus,
    httpStats,
    esp32BaseUrl,
    setEsp32BaseUrl,
    httpPollingInterval,
    setHttpPollingInterval,
    startHttpPolling,
    stopHttpPolling,
    sendHttpControl,
    prototypeEvents,
    latestHttpTelemetry
  } = useMonitoring();

  // Local URL editing state
  const [urlInput, setUrlInput] = useState(esp32BaseUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  // Command submission state
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Confirmation modal state for manual actuator toggles
  const [pendingConfirm, setPendingConfirm] = useState<{
    type: 'fan' | 'peltier';
    targetState: boolean;
    description: string;
  } | null>(null);

  // In-memory temperature chart history buffer
  const [chartData, setChartData] = useState<Array<{
    time: string;
    probe: number | null;
    air: number | null;
    humidity: number | null;
    fan: number;
    peltier: number;
  }>>([]);

  // Sync latest telemetry to chart data
  useEffect(() => {
    if (!latestHttpTelemetry) return;

    const timeStr = new Date(latestHttpTelemetry.timestamp).toLocaleTimeString();
    const newPoint = {
      time: timeStr,
      probe: latestHttpTelemetry.sensors.temperature_probe,
      air: latestHttpTelemetry.sensors.air_temperature,
      humidity: latestHttpTelemetry.sensors.humidity,
      fan: latestHttpTelemetry.actuators.fan ? 1 : 0,
      peltier: latestHttpTelemetry.actuators.peltier ? 1 : 0
    };

    setChartData(prev => [...prev.slice(-29), newPoint]);
  }, [latestHttpTelemetry]);

  const isConnected = httpStatus === 'CONNECTED' || httpStatus === 'DEGRADED';
  const sensors = latestHttpTelemetry?.sensors;
  const actuators = latestHttpTelemetry?.actuators;
  const safety = latestHttpTelemetry?.safety;
  const currentMode = latestHttpTelemetry?.mode || 'AUTO';

  // URL save
  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setEsp32BaseUrl(urlInput);
    setIsEditingUrl(false);
    startHttpPolling();
  };

  // Quick Preset URLs
  const applyPreset = (preset: string) => {
    setUrlInput(preset);
    setEsp32BaseUrl(preset);
    setIsEditingUrl(false);
    startHttpPolling();
  };

  // Mode Toggle (AUTO <-> MANUAL)
  const handleToggleMode = async (targetMode: 'AUTO' | 'MANUAL') => {
    setIsPending(true);
    setFeedback(null);
    try {
      await sendHttpControl({ mode: targetMode });
      setFeedback({ success: true, message: `System transitioned to ${targetMode} mode.` });
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Mode switch failed.' });
    } finally {
      setIsPending(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Execute confirmed command
  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const { type, targetState } = pendingConfirm;
    setPendingConfirm(null);
    setIsPending(true);
    setFeedback(null);

    try {
      const cmd: ESP32ControlCommand = { mode: 'MANUAL' };
      if (type === 'fan') {
        cmd.fan = targetState;
      } else if (type === 'peltier') {
        cmd.peltier = targetState;
      }
      await sendHttpControl(cmd);
      setFeedback({
        success: true,
        message: `${type.toUpperCase()} commanded ${targetState ? 'ON' : 'OFF'} successfully.`
      });
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Actuator command rejected.' });
    } finally {
      setIsPending(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 0. PROTOTYPE EDUCATIONAL USE CALLOUT ─── */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-amber-900 font-sans shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <span>NeoNattle Educational IoT Prototype (Developed by Avenza)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200/60 text-amber-900 border border-amber-300 font-bold">
                NON-CLINICAL
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              Designed solely for IoT experimental sensor evaluation and environmental telemetry. Not certified for patient or neonatal medical monitoring.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
          <span className="text-amber-800">Threshold:</span>
          <span className="font-bold bg-amber-100 border border-amber-200 px-2 py-0.5 rounded text-amber-900">
            30.0°C (Demo Setting)
          </span>
        </div>
      </div>

      {/* ─── 1. ESP32 CONNECTION & NETWORK BAR ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-sans text-slate-900">
                  ESP32 Wi-Fi REST Connection
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : httpStatus === 'CONNECTING'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`} />
                  {httpStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Target URL: <strong className="font-mono text-slate-700">{esp32BaseUrl}</strong>
              </p>
            </div>
          </div>

          {/* Polling & Connect Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Poll:</span>
              <select
                aria-label="Polling Interval"
                value={httpPollingInterval}
                onChange={(e) => setHttpPollingInterval(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={500}>500 ms</option>
                <option value={1000}>1000 ms</option>
                <option value={2000}>2000 ms</option>
                <option value={5000}>5000 ms</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingUrl(!isEditingUrl)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Configure Target</span>
            </button>

            {isConnected ? (
              <button
                type="button"
                onClick={stopHttpPolling}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Pause Polling</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startHttpPolling}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Connect / Resume</span>
              </button>
            )}
          </div>
        </div>

        {/* URL Configuration Dropdown / Form */}
        {isEditingUrl && (
          <form onSubmit={handleSaveUrl} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                aria-label="ESP32 API Base URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://192.168.1.150 or /api/esp32"
                className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Save & Connect
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500">
              <span className="font-sans text-slate-600">Quick Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset(`${window.location.origin}/api/esp32`)}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-blue-50 text-blue-700 cursor-pointer"
              >
                Vite Proxy (/api/esp32)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('http://localhost:8080')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-blue-50 text-blue-700 cursor-pointer"
              >
                Local Mock Server (8080)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('http://192.168.4.1')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-blue-50 text-blue-700 cursor-pointer"
              >
                Soft-AP (192.168.4.1)
              </button>
            </div>
          </form>
        )}

        {/* Telemetry Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 block uppercase">Packets Streamed</span>
            <span className="text-sm font-bold text-slate-800 tabular-nums">
              {httpStats.packetsReceived.toLocaleString()} pkts
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 block uppercase">HTTP Round-Trip Latency</span>
            <span className="text-sm font-bold text-blue-700 tabular-nums">
              {httpStats.lastLatencyMs} ms
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 block uppercase">Last Sample Time</span>
            <span className="text-xs font-bold text-slate-700 truncate block">
              {httpStats.lastUpdated ? new Date(httpStats.lastUpdated).toLocaleTimeString() : 'Awaiting data'}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 block uppercase">Failsafe Interlock</span>
            <span className={`text-xs font-bold flex items-center gap-1 ${
              safety?.emergency_cutoff_active ? 'text-rose-700' : 'text-emerald-700'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {safety?.failsafe_status || 'NOMINAL'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. LIVE ENVIRONMENTAL READINGS & SENSOR INTEGRITY ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chamber Temperature (DS18B20) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-blue-600" />
              Chamber Probe
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
              DS18B20 (GPIO 4)
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
              {sensors?.temperature_probe !== null && sensors?.temperature_probe !== undefined
                ? sensors.temperature_probe.toFixed(2)
                : '—'}
            </span>
            <span className="text-sm font-sans text-slate-500">°C</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 pt-1 flex items-center justify-between border-t border-slate-100">
            <span>Primary Sensor</span>
            <span className={sensors?.temperature_probe !== null ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
              {sensors?.temperature_probe !== null ? 'ONLINE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Ambient Air Temp (DHT11) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-indigo-600" />
              Air Temperature
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
              DHT11 (GPIO 5)
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
              {sensors?.air_temperature !== null && sensors?.air_temperature !== undefined
                ? sensors.air_temperature.toFixed(1)
                : '—'}
            </span>
            <span className="text-sm font-sans text-slate-500">°C</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 pt-1 flex items-center justify-between border-t border-slate-100">
            <span>Fallback Sensor</span>
            <span className={sensors?.air_temperature !== null ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
              {sensors?.air_temperature !== null ? 'ONLINE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Relative Humidity (DHT11) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-600" />
              Relative Humidity
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
              DHT11 (GPIO 5)
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-cyan-700 tabular-nums">
              {sensors?.humidity !== null && sensors?.humidity !== undefined
                ? sensors.humidity.toFixed(1)
                : '—'}
            </span>
            <span className="text-sm font-sans text-slate-500">% RH</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 pt-1 flex items-center justify-between border-t border-slate-100">
            <span>Chamber Airflow</span>
            <span className="text-slate-600">Equilibrium</span>
          </div>
        </div>

        {/* Raw Optical PPG (MAX30102) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              Raw Optical PPG
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
              MAX30102 (0x57)
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-500">Raw IR:</span>
              <strong className="text-slate-900 tabular-nums">
                {sensors?.max30102?.raw_ir?.toLocaleString() ?? '—'}
              </strong>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-500">Raw Red:</span>
              <strong className="text-slate-900 tabular-nums">
                {sensors?.max30102?.raw_red?.toLocaleString() ?? '—'}
              </strong>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Contact: {sensors?.max30102?.contact ? 'DETECTED' : 'NONE'}</span>
            <span className="text-amber-700 font-semibold">Uncalibrated</span>
          </div>
        </div>
      </div>

      {/* ─── 3. TEMPERATURE & ACTUATOR LIVE HISTORY CHART ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold font-sans text-slate-900">
              Live Temperature Trend & Prototype 30.0°C Threshold
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Probe Temp
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Air Temp
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-bold">
              --- 30.0°C Threshold
            </span>
          </div>
        </div>

        <div className="w-full h-64 pt-2">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-sans">
              <Activity className="w-8 h-8 text-slate-300 animate-pulse mb-2" />
              <span>Awaiting telemetry samples from ESP32...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  unit="°C"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <ReferenceLine
                  y={30.0}
                  stroke="#E11D48"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Prototype Fan ON: 30.0°C',
                    fill: '#E11D48',
                    fontSize: 10,
                    position: 'top'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="probe"
                  name="Chamber Probe (DS18B20)"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="air"
                  name="Air Temp (DHT11)"
                  stroke="#818CF8"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── 4. ACTUATOR CONTROLS & AUTOMATION INTERLOCK ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Actuator State & Commands (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold font-sans text-slate-900">
                Actuator Regulation & Output State
              </h3>
            </div>
            {/* Mode Selector */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => handleToggleMode('AUTO')}
                disabled={isPending}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  currentMode === 'AUTO'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AUTO HYSTERESIS
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('MANUAL')}
                disabled={isPending}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  currentMode === 'MANUAL'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                MANUAL OVERRIDE
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 animate-fade-in ${
              feedback.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {feedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Actuator Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fan Control */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Wind className={`w-4 h-4 text-blue-600 ${actuators?.fan ? 'animate-spin' : ''}`} />
                  <span>Circulation Fan (GPIO 18)</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  actuators?.fan
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {actuators?.fan ? 'ENERGIZED' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Trigger reason: <strong className="font-mono text-slate-700">{actuators?.fan_reason || 'Autonomous idle'}</strong>
              </p>
              <button
                type="button"
                onClick={() => setPendingConfirm({
                  type: 'fan',
                  targetState: !actuators?.fan,
                  description: `Confirm switching Circulation Fan ${!actuators?.fan ? 'ON' : 'OFF'}`
                })}
                disabled={isPending || currentMode !== 'MANUAL'}
                className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  actuators?.fan
                    ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                }`}
              >
                {actuators?.fan ? 'De-energize Fan' : 'Energize Fan'}
              </button>
            </div>

            {/* Peltier Control */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Thermal Peltier (GPIO 25)</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  actuators?.peltier
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {actuators?.peltier ? 'HEATING' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Interlock: <strong className="font-mono text-slate-700">{safety?.heatsink_fan_interlock ? 'Heatsink Fan Enforced' : 'Independent'}</strong>
              </p>
              <button
                type="button"
                onClick={() => setPendingConfirm({
                  type: 'peltier',
                  targetState: !actuators?.peltier,
                  description: `Confirm switching Peltier Element ${!actuators?.peltier ? 'ON' : 'OFF'}. Note: Fan will be forced ON.`
                })}
                disabled={isPending || currentMode !== 'MANUAL' || safety?.emergency_cutoff_active}
                className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  actuators?.peltier
                    ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    : 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                }`}
              >
                {actuators?.peltier ? 'De-energize Peltier' : 'Energize Peltier'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── 5. PROTOTYPE EVENT & AUDIT TIMELINE (5 Cols) ─── */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold font-sans text-slate-900">
                Prototype Event Timeline
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              AUDIT LOG ({prototypeEvents.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-72 space-y-2 pr-1">
            {prototypeEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-sans">
                No prototype events recorded yet. Connect to ESP32 to monitor live state changes.
              </div>
            ) : (
              prototypeEvents.map(evt => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-sans flex items-start gap-2.5"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                    evt.severity === 'CRITICAL' ? 'bg-rose-500' :
                    evt.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                      <span className="uppercase font-bold text-slate-600">{evt.type}</span>
                      <span>{evt.timestamp}</span>
                    </div>
                    <p className="text-slate-700 text-xs leading-snug break-words">
                      {evt.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL CONFIRMATION DIALOG FOR ACTUATORS ─── */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-sans text-slate-900">
                  Confirm Actuator Action
                </h4>
                <p className="text-xs text-slate-500 font-sans">
                  Hardware manual override command confirmation
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-sans">
              {pendingConfirm.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Confirm Command
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
