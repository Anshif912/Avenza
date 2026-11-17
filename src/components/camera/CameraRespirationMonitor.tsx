import React, { useRef, useState, useEffect } from 'react';
import { useMonitoring } from '../../context/MonitoringContext';
import { CameraService } from '../../services/CameraService';
import { Camera, Play, Square, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CameraTrackingState, SignalQuality } from '../../types/avenza';
import { DataSourceBadge } from '../design-system/DesignSystemComponents';

export const CameraRespirationMonitor: React.FC = () => {
  const { handleLiveCameraTelemetry } = useMonitoring();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraServiceRef = useRef<CameraService>(new CameraService());

  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [cameraTelemetry, setCameraTelemetry] = useState<{
    amplitude: number | null;
    baseline: number | null;
    delta: number;
    tracking: CameraTrackingState;
    quality: SignalQuality;
    rate: number | null;
  }>({
    amplitude: null,
    baseline: null,
    delta: 0,
    tracking: 'NOT_STARTED',
    quality: 'POOR',
    rate: null
  });

  const [graphData, setGraphData] = useState<Array<{ time: string; amp: number | null }>>([]);

  const handleStartCamera = async () => {
    if (videoRef.current && canvasRef.current) {
      const success = await cameraServiceRef.current.startRealCamera(
        videoRef.current,
        canvasRef.current,
        telemetry => {
          setCameraTelemetry({
            amplitude: telemetry.movementAmplitude,
            baseline: telemetry.movementBaseline,
            delta: telemetry.movementDeltaPercent,
            tracking: telemetry.trackingStatus,
            quality: telemetry.signalQuality,
            rate: telemetry.estimatedRespirationRate
          });

          handleLiveCameraTelemetry(telemetry);

          setGraphData(prev => {
            const next = [
              ...prev,
              { time: new Date().toLocaleTimeString(), amp: telemetry.movementAmplitude }
            ];
            return next.slice(-30);
          });
        }
      );
      setIsWebcamActive(success);
    }
  };

  const handleStopCamera = () => {
    cameraServiceRef.current.stopCamera();
    setIsWebcamActive(false);
    setCameraTelemetry({
      amplitude: null,
      baseline: null,
      delta: 0,
      tracking: 'NOT_STARTED',
      quality: 'POOR',
      rate: null
    });
    setGraphData([]);
  };

  const handleRecalibrate = () => {
    cameraServiceRef.current.recalibrate();
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      cameraServiceRef.current.stopCamera();
    };
  }, []);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-5 font-mono">
      
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-[#172033] font-sans tracking-tight">
            Non-Contact Thoracic Motion Monitor
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
            isWebcamActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {isWebcamActive ? 'REAL CAMERA SIGNAL' : 'CAMERA NOT STARTED'}
          </span>
          <DataSourceBadge source="DERIVED" />
        </div>
      </div>

      {/* Main Body: Video Preview & Telemetry Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left: Video Preview & Controls */}
        <div className="space-y-3">
          <div className="relative w-full h-48 bg-[#F8FAFC] rounded-xl overflow-hidden border border-[#E2E8F0] flex items-center justify-center">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${isWebcamActive ? 'block' : 'hidden'}`}
            />
            {/* Canvas overlay for optical flow diff */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none opacity-60 ${isWebcamActive ? 'block' : 'hidden'}`}
            />

            {/* Offline / Placeholder View */}
            {!isWebcamActive && (
              <div className="text-center p-4 space-y-2 text-slate-500">
                <Camera className="w-10 h-10 mx-auto text-slate-400" />
                <div className="text-xs font-semibold text-slate-800 font-sans">
                  Camera Stream Inactive
                </div>
                <div className="text-[10px] text-slate-500 max-w-xs font-sans">
                  Click 'Start Real Webcam' to calibrate local non-contact thoracic motion tracking.
                </div>
              </div>
            )}

            {/* ROI Target Box when active */}
            {isWebcamActive && (
              <div className="absolute inset-x-[20%] inset-y-[25%] border-2 border-dashed border-blue-500 rounded-lg pointer-events-none flex items-start justify-between p-1 bg-blue-500/10">
                <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">THORACIC ROI</span>
                <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">LOCKED</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {!isWebcamActive ? (
              <button
                onClick={handleStartCamera}
                className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs font-sans rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Real Webcam</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleStopCamera}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Stream</span>
                </button>
                <button
                  onClick={handleRecalibrate}
                  className="flex items-center space-x-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Recalibrate</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Telemetry Matrix & Mini Waveform */}
        <div className="space-y-3">
          
          {/* Status Matrix */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500">Motion Amplitude</span>
              <div className="text-lg font-extrabold text-blue-700 tabular-nums">
                {cameraTelemetry.amplitude !== null ? `${(cameraTelemetry.amplitude * 100).toFixed(1)}%` : '--'}
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500">Estimated Rate</span>
              <div className="text-lg font-extrabold text-teal-700 tabular-nums">
                {cameraTelemetry.rate !== null ? `${cameraTelemetry.rate} BrPM` : '--'}
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500">Tracking Status</span>
              <div className={`text-xs font-bold ${
                cameraTelemetry.tracking === 'LOCKED' ? 'text-emerald-700' :
                cameraTelemetry.tracking === 'NOT_STARTED' ? 'text-slate-500' : 'text-amber-700'
              }`}>
                {cameraTelemetry.tracking.replace('_', ' ')}
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500">Baseline Delta</span>
              <div className={`text-xs font-bold ${
                cameraTelemetry.delta < -20 ? 'text-rose-600' : 'text-slate-700'
              }`}>
                {cameraTelemetry.amplitude !== null ? `${cameraTelemetry.delta > 0 ? '+' : ''}${cameraTelemetry.delta.toFixed(1)}%` : '--'}
              </div>
            </div>
          </div>

          {/* Mini Real-Time Optical Flow Waveform */}
          <div className="h-24 bg-[#F8FAFC] rounded-xl p-2 border border-[#E2E8F0]">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <YAxis domain={[0, 1]} hide />
                  <XAxis dataKey="time" hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', fontSize: 10, borderRadius: '8px' }}
                    labelStyle={{ color: '#0F172A' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amp"
                    name="Motion Amp"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-500 font-sans">
                {isWebcamActive ? 'Calibrating signal...' : 'WAITING FOR CAMERA STREAM'}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Medical Technology Disclaimer */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[10px] font-sans text-slate-600 leading-relaxed">
        <strong className="text-blue-900 font-mono">Camera Provenance Chain:</strong> Laptop Webcam → Chest / Abdomen ROI → Optical Frame Differencing → Camera-Derived Respiratory Motion Evidence. Non-contact motion evidence is evaluated in combination with optical PPG; camera evidence alone does not produce a clinical diagnosis.
      </div>

    </div>
  );
};
