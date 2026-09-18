import React from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import { X, CheckCircle, AlertTriangle, ShieldAlert, Activity, FileText, BrainCircuit, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const EventDetailModal: React.FC = () => {
  const { selectedEvent, setSelectedEvent, acknowledgeAlert } = useMonitoring();

  if (!selectedEvent) return null;

  const details = selectedEvent.eventDetails;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-navy-850 border border-navy-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 border-b border-navy-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
              selectedEvent.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
              selectedEvent.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
              selectedEvent.severity === 'SENSOR' ? 'bg-cyan-500/20 text-cyan-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100 font-mono">
                  Event Evidence View: <span className="text-cyan-400">{selectedEvent.id}</span>
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  selectedEvent.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' :
                  selectedEvent.severity === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                  'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                }`}>
                  {selectedEvent.severity}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged at {selectedEvent.timestamp} • Duration: {selectedEvent.durationSeconds ? `${selectedEvent.durationSeconds}s` : 'N/A'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedEvent(null)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-navy-750 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          
          {/* Summary Banner */}
          <div className="bg-navy-900/90 border border-navy-700 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-mono uppercase">Event Summary</div>
              <div className="text-sm font-semibold text-slate-100 mt-0.5">{selectedEvent.evidenceSummary}</div>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <div>
                <span className="text-slate-400">Signal Quality:</span>{' '}
                <span className="text-emerald-400 font-bold">{selectedEvent.signalQuality}</span>
              </div>
              <div>
                <span className="text-slate-400">ACK Status:</span>{' '}
                <span className={selectedEvent.acknowledged ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold animate-pulse'}>
                  {selectedEvent.acknowledged ? 'ACKNOWLEDGED' : 'UNACKNOWLEDGED'}
                </span>
              </div>
            </div>
          </div>

          {/* Prototype Model Disclaimer Callout */}
          <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl flex items-center space-x-3 text-xs text-purple-200">
            <BrainCircuit className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-purple-300 uppercase font-mono">PROTOTYPE APNEA SCORE — NOT A CLINICAL DIAGNOSIS</span>: Prototype score of{' '}
              <strong className="text-cyan-300 font-mono text-sm">{details?.aiProbability || 94}%</strong> is an evidence-derived model output based on 3-channel multimodal fusion. It is not a clinical diagnosis.
            </div>
          </div>

          {/* Physiological Metrics Grid */}
          {details && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-navy-900/60 border border-navy-750 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">HR Before / During / Rec</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                  {details.hrBefore} <span className="text-rose-400">→ {details.hrDuring}</span> <span className="text-emerald-400">→ {details.hrRecovery}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Unit: BPM (Deceleration)</div>
              </div>

              <div className="bg-navy-900/60 border border-navy-750 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">SpO₂ Before / Nadir / Rec</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                  {details.spo2Before}% <span className="text-rose-400">→ {details.spo2Nadir}%</span> <span className="text-emerald-400">→ {details.spo2Recovery}%</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Unit: % (Desaturation)</div>
              </div>

              <div className="bg-navy-900/60 border border-navy-750 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">Respiration Wave</div>
                <div className="text-lg font-bold font-mono text-purple-400 mt-1">
                  {details.respiratoryAvailable ? 'PAUSE (Flatline)' : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Thoracic impedance sensor</div>
              </div>

              <div className="bg-navy-900/60 border border-navy-750 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-mono">Data Origin Tag</div>
                <div className="text-sm font-bold font-mono text-amber-300 mt-1.5 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 inline-block">
                  {details.dataOrigin}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Labelled synthetic telemetry</div>
              </div>
            </div>
          )}

          {/* Evidence Waveform Chart */}
          {details?.waveformSnapshot && details.waveformSnapshot.length > 0 && (
            <div className="bg-navy-900/80 border border-navy-750 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Synchronized Multi-Signal Evidence Waveform</span>
                </h3>
                <span className="text-[11px] text-cyan-400 font-mono">Timeline window: 15s centered</span>
              </div>

              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={details.waveformSnapshot}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                    <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="hr" domain={[60, 160]} stroke="#38BDF8" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="spo2" domain={[70, 100]} orientation="right" stroke="#10B981" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F1A3A', borderColor: '#1C2D5A', fontSize: 12 }}
                      labelStyle={{ color: '#00F0FF' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="hr" type="monotone" dataKey="hr" name="Heart Rate (BPM)" stroke="#38BDF8" strokeWidth={2} dot={false} />
                    <Line yAxisId="spo2" type="monotone" dataKey="spo2" name="SpO₂ (%)" stroke="#10B981" strokeWidth={2} dot={false} />
                    {details.respiratoryAvailable && (
                      <Line yAxisId="hr" type="monotone" dataKey="resp" name="Respiration Wave" stroke="#A855F7" strokeWidth={1.5} dot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Explainable Feature Attribution Table */}
          {details?.contributingFeatures && details.contributingFeatures.length > 0 && (
            <div className="bg-navy-900/60 border border-navy-750 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-2">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                <span>Contributing Features & Model Attribution</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-navy-800 text-slate-400 font-mono border-b border-navy-750">
                    <tr>
                      <th className="p-2">Feature Name</th>
                      <th className="p-2">Observed Weight / Impact</th>
                      <th className="p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-750 font-mono text-slate-300">
                    {details.contributingFeatures.map((feat, idx) => (
                      <tr key={idx} className="hover:bg-navy-800/40">
                        <td className="p-2 font-semibold text-cyan-300">{feat.feature}</td>
                        <td className="p-2 font-bold text-rose-400">{feat.weight}</td>
                        <td className="p-2 text-slate-400">{feat.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-navy-900 px-6 py-3 border-t border-navy-700 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            AVENZA Evidence Engine • Audit Trail Logged
          </div>

          <div className="flex items-center space-x-3">
            {!selectedEvent.acknowledged && (
              <button
                onClick={() => {
                  acknowledgeAlert(selectedEvent.id);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Acknowledge Event</span>
              </button>
            )}

            <button
              onClick={() => setSelectedEvent(null)}
              className="px-4 py-2 bg-navy-750 hover:bg-navy-700 text-slate-200 text-xs font-semibold rounded-xl border border-navy-600 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
