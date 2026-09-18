import React from 'react';
import { useMonitoring } from '../context/MonitoringContext';
import {
  Heart, Activity, Thermometer, BrainCircuit,
  AlertTriangle, ArrowRight, Layers, Usb, RefreshCw, XCircle, Info
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ClinicalReferencePanel } from '../components/common/ClinicalReferencePanel';
import {
  VitalMetricCard, SpotlightCard, ApneaStateBadge,
  ArcGauge, FusionWeightBar, SectionHeader, ClinicalDisclaimer
} from '../components/design-system/DesignSystemComponents';

export const DashboardPage: React.FC = () => {
  const {
    vitals,
    apnea,
    thermal,
    waveforms,
    setActiveTab,
    setSelectedEvent,
    alerts,
    serialStatus,
    serialStats,
    serialError,
    isSerialSupported,
    connectSerial,
    disconnectSerial
  } = useMonitoring();

  const isConnected = serialStatus === 'CONNECTED';
  const recentAlerts = alerts.slice(0, 4);
  const evidence = apnea.multimodalEvidence;
  const recentWaveforms = waveforms.slice(-60);

  const isEvaluating = apnea.state !== 'NO_EVALUATION';
  const refContext = evidence.clinicalReferenceContext;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        icon={BrainCircuit}
        title="Multimodal Telemetry Command Center"
        subtitle="Real-time cardiorespiratory fusion · non-contact vision · thermal regulation"
        badge={isConnected ? 'ESP32 LIVE (115.2k)' : 'WAITING FOR HARDWARE'}
        badgeVariant={isConnected ? 'emerald' : 'amber'}
        action={
          <button
            onClick={() => setActiveTab('aiApnea')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-950 hover:bg-violet-900 text-violet-300 border border-violet-500/40 rounded-card text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Evidence Deep Dive <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      />

      {/* ─── HARDWARE CONNECTION BANNER ──────────────────────────── */}
      {!isConnected ? (
        <div className="bg-surface-1 border border-cyan-500/30 rounded-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-medical-cyan/10 border border-medical-cyan/30 flex items-center justify-center shrink-0">
              <Usb className="w-5 h-5 text-medical-cyan" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-slate-100 flex items-center gap-2">
                Connect Real ESP32 Hardware
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-0 border border-line-0 text-cyan-300">
                  USB Serial · 115,200 Baud
                </span>
              </h4>
              <p className="text-xs font-sans text-slate-400 mt-0.5">
                Stream real-time MAX30102 PPG, DS18B20 probe temperature, and DHT11 humidity into the dashboard.
              </p>
              <div className="text-[11px] font-mono text-amber-300/90 mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Make sure the <strong>Arduino Serial Monitor</strong> is closed before connecting.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            {serialError && (
              <span className="text-xs font-mono text-rose-400 max-w-xs truncate" title={serialError}>
                {serialError}
              </span>
            )}
            <button
              onClick={connectSerial}
              disabled={!isSerialSupported || serialStatus === 'CONNECTING'}
              className="flex items-center gap-2 px-5 py-2.5 bg-medical-cyan hover:brightness-110 text-black font-extrabold font-sans text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {serialStatus === 'CONNECTING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Selecting Port...
                </>
              ) : (
                <>
                  <Usb className="w-4 h-4" />
                  CONNECT ESP32 (COM3)
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300 font-bold">ESP32 TELEMETRY STREAM ACTIVE</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Port: Web Serial @ 115,200 baud</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-semibold">{serialStats.packetsReceived.toLocaleString()} packets received</span>
          </div>

          <button
            onClick={disconnectSerial}
            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </div>
      )}

      {/* ─── ROW 1: Apnea State + Vitals ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

        {/* Apnea State — spans 1 col, tall card */}
        <SpotlightCard glowColor={apnea.state === 'CONFIRMED' ? 'rose' : apnea.state === 'SUSPECTED' ? 'amber' : 'violet'} className="p-6 space-y-5 flex flex-col items-center justify-center text-center">
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Prototype Apnea Score</div>
            <ArcGauge
              value={isEvaluating ? apnea.probability : null}
              size={170}
              critical={apnea.state === 'CONFIRMED'}
            />
          </div>
          <ApneaStateBadge state={apnea.state} size="md" />
          <p className="text-[11px] font-mono text-slate-400 max-w-[180px]">{evidence.reason}</p>
          <button
            onClick={() => setActiveTab('aiApnea')}
            className="w-full py-2 rounded-xl bg-violet-950/80 hover:bg-violet-900 text-violet-300 border border-violet-500/30 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Full Evidence Console →
          </button>
        </SpotlightCard>

        {/* Vitals — 3 col */}
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <VitalMetricCard
            title="Heart Rate"
            value={vitals.heartRate}
            unit="BPM"
            baseline={evidence.baselines.heartRate.baseline ?? '--'}
            delta={vitals.heartRate !== null ? evidence.baselines.heartRate.deltaBpm : undefined}
            deltaUnit=" BPM"
            signalQuality={vitals.signalQuality}
            source={vitals.heartRateSource || 'SIMULATED'}
            icon={Heart}
            accentColor="rose"
            dataAgeSec={vitals.dataAgeSeconds}
            isCritical={apnea.state === 'CONFIRMED' && evidence.baselines.heartRate.deltaBpm < -15}
            waitingLabel="WAITING FOR SIGNAL"
            referenceRangeText={refContext?.hrEvaluation?.referenceText || '100–160 BPM'}
            referenceStatusLabel={refContext?.hrEvaluation?.statusLabel || 'WITHIN REFERENCE'}
            referenceStatusWarning={refContext?.hrEvaluation?.isWarning}
          />
          <VitalMetricCard
            title="SpO₂ Saturation"
            value={vitals.spo2}
            unit="%"
            baseline={evidence.baselines.spo2.baseline ?? '--'}
            delta={vitals.spo2 !== null ? evidence.baselines.spo2.deltaPercent : undefined}
            deltaUnit="%"
            signalQuality={evidence.spo2Evidence.quality}
            source={vitals.spo2Source || 'SIMULATED'}
            icon={Activity}
            accentColor="cyan"
            dataAgeSec={vitals.dataAgeSeconds}
            isCritical={vitals.spo2 !== null && vitals.spo2 < 85}
            waitingLabel="UNCALIBRATED"
            referenceRangeText={refContext?.spo2Evaluation?.targetText || '92–98%'}
            referenceStatusLabel={refContext?.spo2Evaluation?.statusLabel || 'WITHIN TARGET'}
            referenceStatusWarning={refContext?.spo2Evaluation?.isDesaturating}
          />
          <VitalMetricCard
            title="Chamber Temp"
            value={vitals.chamberTemp !== null ? vitals.chamberTemp.toFixed(1) : null}
            unit="°C"
            baseline={vitals.chamberTemp !== null ? `${vitals.targetTemp.toFixed(1)} target` : '--'}
            delta={vitals.chamberTemp !== null ? parseFloat((vitals.chamberTemp - vitals.targetTemp).toFixed(1)) : undefined}
            deltaUnit="°C"
            signalQuality={vitals.chamberTemp !== null ? 'GOOD' : 'POOR'}
            source="MEASURED"
            icon={Thermometer}
            accentColor="amber"
            dataAgeSec={vitals.dataAgeSeconds}
            waitingLabel="WAITING FOR SENSOR"
            referenceRangeText={refContext?.tempEvaluation?.referenceText || '36.5–37.5 °C'}
            referenceStatusLabel={refContext?.tempEvaluation?.statusLabel || 'WITHIN REFERENCE'}
            referenceStatusWarning={refContext?.tempEvaluation?.isWarning}
          />
        </div>
      </div>

      {/* ─── CLINICAL REFERENCE LAYER EMBED ──────────────────────── */}
      <ClinicalReferencePanel />

      {/* ─── ROW 2: Fusion Weights + Waveform Strip ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Fusion Weight attribution */}
        <SpotlightCard glowColor="violet" className="lg:col-span-2 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-sans font-bold text-slate-200">Dynamic Fusion Weights</span>
          </div>
          <FusionWeightBar
            weights={evidence.prototypeWeights}
            effectiveWeights={evidence.effectiveWeights}
          />
          <ClinicalDisclaimer compact />
        </SpotlightCard>

        {/* Live waveform strip */}
        <SpotlightCard glowColor="cyan" className="lg:col-span-3 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-sans font-bold text-slate-200">Live Signal Streams</span>
            </div>
            <button
              onClick={() => setActiveTab('liveMonitoring')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Full 8-channel view <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-48 chart-container p-3">
            {recentWaveforms.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recentWaveforms} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ppgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2d5a" />
                  <YAxis domain={['auto', 'auto']} stroke="#374151" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1c2d5a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    labelStyle={{ color: '#06b6d4' }}
                  />
                  <Area type="monotone" dataKey="rawPPG" name="Raw IR PPG" stroke="#10b981" fill="url(#ppgGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Area type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#38bdf8" fill="url(#hrGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-500 font-sans">
                <Activity className="w-8 h-8 text-slate-600 animate-pulse" />
                <span className="text-xs font-mono font-semibold">WAITING FOR ESP32 TELEMETRY STREAM</span>
                <span className="text-[10px] text-slate-600 font-mono">Connect ESP32 hardware via USB Serial above</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Raw IR PPG</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sky-400 inline-block" /> Heart Rate (BPM)</div>
            <span className="ml-auto">{recentWaveforms.length > 0 ? `Latest ${recentWaveforms.length} samples` : '0 samples'}</span>
          </div>
        </SpotlightCard>
      </div>

      {/* ─── ROW 3: Alert feed + Thermal overview ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Alerts */}
        <SpotlightCard glowColor="amber" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-sans font-bold text-slate-200">Recent Alerts</span>
            </div>
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              All alerts <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-mono">
              NO ACTIVE ALERTS
            </div>
          ) : (
            <div className="divide-y divide-line-0">
              {recentAlerts.map(alert => (
                <button
                  key={alert.id}
                  onClick={() => setSelectedEvent(alert)}
                  className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-surface-2 rounded transition-colors px-1 group cursor-pointer"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-400 animate-pulse' :
                    alert.severity === 'WARNING'  ? 'bg-amber-400' : 'bg-cyan-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-sans font-semibold text-slate-200 truncate">{alert.type}</div>
                    <div className="text-[10px] font-mono text-slate-400">{alert.timestamp} · {alert.id}</div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    alert.acknowledged ? 'text-slate-500 bg-slate-900' : 'text-rose-400 bg-rose-950/60'
                  }`}>
                    {alert.acknowledged ? 'ACK' : 'NEW'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </SpotlightCard>

        {/* Thermal overview */}
        <SpotlightCard glowColor="amber" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-sans font-bold text-slate-200">Thermal Micro-Climate</span>
            </div>
            <button
              onClick={() => setActiveTab('thermal')}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Controls <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            {[
              {
                label: 'Chamber Temp',
                value: thermal.chamberTemp !== null ? `${thermal.chamberTemp.toFixed(1)}°C` : '--',
                status: thermal.chamberTemp !== null ? 'MEASURED' : 'WAITING',
                color: thermal.chamberTemp !== null ? 'text-amber-300' : 'text-slate-500'
              },
              {
                label: 'Target Temp',
                value: `${thermal.targetTemp.toFixed(1)}°C`,
                status: 'SETPOINT',
                color: 'text-cyan-300'
              },
              {
                label: 'Humidity',
                value: thermal.humidity !== null ? `${thermal.humidity}%` : '--',
                status: thermal.humidity !== null ? 'MEASURED' : 'WAITING',
                color: thermal.humidity !== null ? 'text-teal-300' : 'text-slate-500'
              },
              {
                label: 'Safety Interlock',
                value: thermal.hardwareSafetyStatus,
                status: 'HW RELAY',
                color: thermal.hardwareSafetyStatus === 'READY' ? 'text-emerald-400' : 'text-slate-500'
              },
            ].map(item => (
              <div key={item.label} className="bg-surface-0 border border-line-0 rounded-chip p-3 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{item.label}</div>
                <div className={`text-lg font-extrabold tabular-nums ${item.color}`}>{item.value}</div>
                <div className="text-[9px] text-slate-500">{item.status}</div>
              </div>
            ))}
          </div>

          {/* Peltier status */}
          <div className="p-3 bg-surface-0 border border-line-0 rounded-chip">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Peltier Controller</span>
              <span className={`font-bold ${
                thermal.peltierCommand === 'HEATING' || thermal.peltierCommand === 'COOLING'
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}>{thermal.peltierCommand}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono mt-1">
              <span className="text-slate-400">Fan State</span>
              <span className="text-slate-300 font-semibold">{thermal.fanCommand}</span>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
};
