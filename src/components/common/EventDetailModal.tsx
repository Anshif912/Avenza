import React from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import { X, CheckCircle, ShieldAlert, Activity, BrainCircuit } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const EventDetailModal: React.FC = () => {
  const { selectedEvent, setSelectedEvent, acknowledgeAlert } = useMonitoring();

  if (!selectedEvent) return null;

  const details = selectedEvent.eventDetails;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-fade-in">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
              selectedEvent.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
              selectedEvent.severity === 'WARNING' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
              selectedEvent.severity === 'SENSOR' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
              'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 font-mono">
                  Event Evidence View: <span className="text-blue-600">{selectedEvent.id}</span>
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  selectedEvent.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                  selectedEvent.severity === 'WARNING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {selectedEvent.severity}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Logged at {selectedEvent.timestamp} • Duration: {selectedEvent.durationSeconds ? `${selectedEvent.durationSeconds}s` : 'N/A'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedEvent(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
          
          {/* Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-slate-500 font-mono uppercase font-semibold">Event Summary</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedEvent.evidenceSummary}</div>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">Signal Quality:</span>{' '}
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{selectedEvent.signalQuality}</span>
              </div>
              <div>
                <span className="text-slate-500">ACK Status:</span>{' '}
                <span className={selectedEvent.acknowledged ? 'text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200' : 'text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse'}>
                  {selectedEvent.acknowledged ? 'ACKNOWLEDGED' : 'UNACKNOWLEDGED'}
                </span>
              </div>
            </div>
          </div>

          {/* Prototype Model Disclaimer Callout */}
          <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex items-center space-x-3 text-xs text-blue-950">
            <BrainCircuit className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-blue-800 uppercase font-mono">PROTOTYPE APNEA SCORE: NOT A CLINICALLY CERTIFIED DIAGNOSIS</span>: Prototype score of{' '}
              <strong className="text-blue-700 font-mono text-sm">{details?.aiProbability || 94}%</strong> is an evidence-derived model output based on 3-channel multimodal fusion. It is not a clinical diagnosis.
            </div>
          </div>

          {/* Physiological Metrics Grid */}
          {details && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                <div className="text-[11px] text-slate-500 font-mono font-medium">HR Before / During / Rec</div>
                <div className="text-base font-bold font-mono text-blue-700 mt-1">
                  {details.hrBefore} <span className="text-rose-600">→ {details.hrDuring}</span> <span className="text-emerald-600">→ {details.hrRecovery}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Unit: BPM (Deceleration)</div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                <div className="text-[11px] text-slate-500 font-mono font-medium">SpO₂ Before / Nadir / Rec</div>
                <div className="text-base font-bold font-mono text-blue-700 mt-1">
                  {details.spo2Before}% <span className="text-rose-600">→ {details.spo2Nadir}%</span> <span className="text-emerald-600">→ {details.spo2Recovery}%</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Unit: % (Desaturation)</div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                <div className="text-[11px] text-slate-500 font-mono font-medium">Respiration Wave</div>
                <div className="text-base font-bold font-mono text-indigo-700 mt-1">
                  {details.respiratoryAvailable ? 'PAUSE (Flatline)' : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Thoracic impedance sensor</div>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                <div className="text-[11px] text-slate-500 font-mono font-medium">Data Origin Tag</div>
                <div className="text-xs font-bold font-mono text-amber-800 mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 inline-block">
                  {details.dataOrigin}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">Labelled synthetic telemetry</div>
              </div>
            </div>
          )}

          {/* Evidence Waveform Chart */}
          {details?.waveformSnapshot && details.waveformSnapshot.length > 0 && (
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Synchronized Multi-Signal Evidence Waveform</span>
                </h3>
                <span className="text-[11px] text-blue-600 font-mono font-medium">Timeline window: 15s centered</span>
              </div>

              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={details.waveformSnapshot}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="time" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="hr" domain={[60, 160]} stroke="#2563EB" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="spo2" domain={[70, 100]} orientation="right" stroke="#059669" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="hr" type="monotone" dataKey="hr" name="Heart Rate (BPM)" stroke="#2563EB" strokeWidth={2} dot={false} />
                    <Line yAxisId="spo2" type="monotone" dataKey="spo2" name="SpO₂ (%)" stroke="#059669" strokeWidth={2} dot={false} />
                    {details.respiratoryAvailable && (
                      <Line yAxisId="hr" type="monotone" dataKey="resp" name="Respiration Wave" stroke="#6366F1" strokeWidth={1.5} dot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Explainable Feature Attribution Table */}
          {details?.contributingFeatures && details.contributingFeatures.length > 0 && (
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-2">
                <BrainCircuit className="w-4 h-4 text-blue-600" />
                <span>Contributing Features & Model Attribution</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-semibold">Feature Name</th>
                      <th className="p-2.5 font-semibold">Observed Weight / Impact</th>
                      <th className="p-2.5 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    {details.contributingFeatures.map((feat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-bold text-blue-700">{feat.feature}</td>
                        <td className="p-2.5 font-bold text-rose-600">{feat.weight}</td>
                        <td className="p-2.5 text-slate-600 font-sans">{feat.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            NeoNattle Evidence Engine • Developed by Avenza
          </div>

          <div className="flex items-center space-x-3">
            {!selectedEvent.acknowledged && (
              <button
                onClick={() => {
                  acknowledgeAlert(selectedEvent.id);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Acknowledge Event</span>
              </button>
            )}

            <button
              onClick={() => setSelectedEvent(null)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-sm transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
