import React from 'react';
import { SignalQualityShield as ShieldType } from '../../types/avenza';
import { ShieldCheck, ShieldAlert, Camera, Heart, Activity } from 'lucide-react';

interface Props {
  shield: ShieldType;
}

export const SignalQualityShield: React.FC<Props> = ({ shield }) => {
  const isOptimal = shield.overallStatus === 'OPTIMAL';
  const isDegraded = shield.overallStatus === 'DEGRADED';

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className={`p-1.5 rounded-lg ${
            isOptimal ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
            isDegraded ? 'bg-amber-50 text-amber-600 border border-amber-200' :
            'bg-rose-50 text-rose-600 border border-rose-200'
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#172033] tracking-tight">
              Signal Quality Shield
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              Tri-channel artifact &amp; integrity validation
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
          isOptimal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          isDegraded ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {shield.overallStatus === 'INSUFFICIENT' ? 'INSUFFICIENT SIGNAL' : shield.overallStatus}
        </span>
      </div>

      {/* 3 Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        
        {/* Camera Channel */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-slate-700 font-medium text-xs">Camera</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
              shield.cameraQuality === 'GOOD' ? 'bg-emerald-100/70 text-emerald-800' :
              shield.cameraQuality === 'FAIR' ? 'bg-amber-100/70 text-amber-800' :
              'bg-slate-200 text-slate-700'
            }`}>
              {shield.cameraQuality}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Tracking:</span>
            <span className={shield.cameraFreshness === 'FRESH' ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
              {shield.cameraFreshness}
            </span>
          </div>
        </div>

        {/* SpO2 Channel */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-700 font-medium text-xs">Optical SpO₂</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
              shield.spo2Quality === 'GOOD' ? 'bg-emerald-100/70 text-emerald-800' :
              shield.spo2Quality === 'FAIR' ? 'bg-amber-100/70 text-amber-800' :
              'bg-slate-200 text-slate-700'
            }`}>
              {shield.spo2Quality}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Perfusion:</span>
            <span className={shield.spo2Freshness === 'FRESH' ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
              {shield.spo2Freshness}
            </span>
          </div>
        </div>

        {/* Heart Rate Channel */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-slate-700 font-medium text-xs">Pulse Rate</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
              shield.hrQuality === 'GOOD' ? 'bg-emerald-100/70 text-emerald-800' :
              shield.hrQuality === 'FAIR' ? 'bg-amber-100/70 text-amber-800' :
              'bg-slate-200 text-slate-700'
            }`}>
              {shield.hrQuality}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Lock:</span>
            <span className={shield.hrFreshness === 'FRESH' ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
              {shield.hrFreshness}
            </span>
          </div>
        </div>

      </div>

      {shield.reason && (
        <div className="pt-2 border-t border-slate-100 text-[11px] font-sans text-slate-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Status reason: {shield.reason}</span>
        </div>
      )}
    </div>
  );
};
