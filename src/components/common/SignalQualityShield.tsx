import React from 'react';
import { SignalQualityShield as ShieldType } from '../../types/avenza';
import { ShieldCheck, ShieldAlert, Camera, Heart, Activity } from 'lucide-react';

interface Props {
  shield: ShieldType;
}

export const SignalQualityShield: React.FC<Props> = ({ shield }) => {
  return (
    <div className="bg-navy-900/90 border border-navy-750 p-4 rounded-2xl space-y-3 shadow-lg font-mono">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className={`w-5 h-5 ${
            shield.overallStatus === 'OPTIMAL' ? 'text-emerald-400' :
            shield.overallStatus === 'DEGRADED' ? 'text-amber-400' :
            'text-rose-400 animate-pulse'
          }`} />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Signal Quality Shield (3 Channels)
          </h3>
        </div>

        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider ${
          shield.overallStatus === 'OPTIMAL' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
          shield.overallStatus === 'DEGRADED' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
          shield.overallStatus === 'INSUFFICIENT' ? 'bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse' :
          'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {shield.overallStatus === 'INSUFFICIENT' ? 'INSUFFICIENT SIGNAL' : shield.overallStatus}
        </span>
      </div>

      {/* 3 Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        
        {/* Camera Channel */}
        <div className="p-2.5 rounded-xl bg-navy-950 border border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <div>
              <span className="text-slate-300 font-semibold block">Camera Motion</span>
              <span className={`text-[10px] ${
                shield.cameraFreshness === 'FRESH' ? 'text-emerald-400' :
                shield.cameraFreshness === 'STALE' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {shield.cameraFreshness}
              </span>
            </div>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            shield.cameraQuality === 'GOOD' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
            shield.cameraQuality === 'FAIR' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
            'bg-rose-950 text-rose-400 border border-rose-500/30'
          }`}>
            ● {shield.cameraQuality}
          </span>
        </div>

        {/* SpO2 Channel */}
        <div className="p-2.5 rounded-xl bg-navy-950 border border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <span className="text-slate-300 font-semibold block">SpO₂ Pulse Ox</span>
              <span className={`text-[10px] ${
                shield.spo2Freshness === 'FRESH' ? 'text-emerald-400' :
                shield.spo2Freshness === 'STALE' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {shield.spo2Freshness}
              </span>
            </div>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            shield.spo2Quality === 'GOOD' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
            shield.spo2Quality === 'FAIR' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
            'bg-rose-950 text-rose-400 border border-rose-500/30'
          }`}>
            ● {shield.spo2Quality}
          </span>
        </div>

        {/* Heart Rate Channel */}
        <div className="p-2.5 rounded-xl bg-navy-950 border border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <div>
              <span className="text-slate-300 font-semibold block">Heart Rate</span>
              <span className={`text-[10px] ${
                shield.hrFreshness === 'FRESH' ? 'text-emerald-400' :
                shield.hrFreshness === 'STALE' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {shield.hrFreshness}
              </span>
            </div>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            shield.hrQuality === 'GOOD' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
            shield.hrQuality === 'FAIR' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
            'bg-rose-950 text-rose-400 border border-rose-500/30'
          }`}>
            ● {shield.hrQuality}
          </span>
        </div>

      </div>

      {shield.reason && (
        <p className="text-[11px] text-slate-400 italic">
          Shield diagnostic status: {shield.reason}
        </p>
      )}
    </div>
  );
};
