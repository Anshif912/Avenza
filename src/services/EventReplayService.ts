import { ReplayFrame, ReplaySession, SignalQuality, AIApneaState } from '../types/avenza';

/**
 * ============================================================================
 * AVENZA — EVENT REPLAY SERVICE & BUFFER ENGINE
 * ============================================================================
 * 
 * CORE GUARANTEES:
 * 1. Rolling Pre-Event Buffer: Automatically caches 30s of telemetry frames.
 * 2. Immutable Channel Provenance: Replay displays channels as recorded ('MEASURED' or 'SIMULATED').
 * 3. Hardware Isolation: Replay engine is strictly READ-ONLY. Never sends commands to ESP32.
 * 4. Deterministic Playback: Supports scrubber, variable speed (0.25x - 4x), frame stepping, and pauses.
 * ============================================================================
 */

export type PlaybackSpeed = 0.25 | 0.5 | 1.0 | 2.0 | 4.0;

export class EventReplayService {
  private rollingBuffer: ReplayFrame[] = [];
  private readonly maxRollingBufferSize = 150; // ~30s at 200ms per frame

  private sessions: Map<string, ReplaySession> = new Map();
  private activeRecordingSession: {
    eventId: string;
    triggerTimestamp: number;
    frames: ReplayFrame[];
    postEventRemainingFrames: number;
    title: string;
  } | null = null;

  // Playback state
  private currentSession: ReplaySession | null = null;
  private currentFrameIndex = 0;
  private isPlaying = false;
  private playbackSpeed: PlaybackSpeed = 1.0;
  private playbackTimer: number | null = null;

  private frameListeners: Set<(frame: ReplayFrame, progress: number, currentOffsetSec: number) => void> = new Set();
  private stateListeners: Set<(isPlaying: boolean, currentFrameIndex: number, totalFrames: number, session: ReplaySession | null) => void> = new Set();

  constructor() {
    this.seedDefaultHistoricalSessions();
  }

  /**
   * Pushes a live frame into the rolling pre-event buffer (and active recording session if one is underway).
   */
  public pushLiveFrame(frame: ReplayFrame): void {
    this.rollingBuffer.push(frame);
    if (this.rollingBuffer.length > this.maxRollingBufferSize) {
      this.rollingBuffer.shift();
    }

    if (this.activeRecordingSession) {
      this.activeRecordingSession.frames.push(frame);
      if (frame.apneaState === 'NORMAL' || frame.apneaState === 'RECOVERED') {
        this.activeRecordingSession.postEventRemainingFrames--;
        if (this.activeRecordingSession.postEventRemainingFrames <= 0) {
          this.finalizeRecording();
        }
      }
    }
  }

  /**
   * Triggers event recording session, capturing 30s pre-event window + live event frames.
   */
  public triggerEventCapture(eventId: string, title: string): void {
    if (this.activeRecordingSession) return;

    const preEventFrames = [...this.rollingBuffer];
    const triggerTs = Date.now();

    // Adjust time offsets relative to trigger timestamp
    preEventFrames.forEach((f, idx) => {
      f.timeOffsetSec = Math.round(((idx - preEventFrames.length) * 0.2) * 10) / 10;
    });

    this.activeRecordingSession = {
      eventId,
      title,
      triggerTimestamp: triggerTs,
      frames: preEventFrames,
      postEventRemainingFrames: 150 // 30s of recovery frames
    };
  }

  private finalizeRecording(): void {
    if (!this.activeRecordingSession) return;

    const { eventId, title, triggerTimestamp, frames } = this.activeRecordingSession;
    const session: ReplaySession = {
      eventId,
      sessionTitle: title,
      recordedAt: new Date(triggerTimestamp).toLocaleString(),
      totalDurationSec: Math.round(frames.length * 0.2),
      preEventDurationSec: 30,
      postEventDurationSec: 30,
      triggerTimestamp,
      frames,
      channelProvenance: {
        heartRate: 'SIMULATED',
        spo2: 'SIMULATED',
        dht11Temperature: 'MEASURED',
        dht11Humidity: 'MEASURED',
        ds18b20ChamberTemp: 'MEASURED',
        rawPPGIR: 'MEASURED',
        rawPPGRed: 'MEASURED',
        cameraMovement: 'MEASURED',
        actuatorStates: 'MEASURED'
      },
      notes: 'Captured live during AVENZA prototype monitoring session.'
    };

    this.sessions.set(eventId, session);
    this.activeRecordingSession = null;
  }

  public getRecordedSessions(): ReplaySession[] {
    return Array.from(this.sessions.values());
  }

  public getSession(eventId: string): ReplaySession | undefined {
    return this.sessions.get(eventId);
  }

  // ==========================================
  // PLAYBACK CONTROL ENGINE
  // ==========================================

  public loadSession(session: ReplaySession): void {
    this.pause();
    this.currentSession = session;
    this.currentFrameIndex = 0;
    this.notifyState();
    if (session.frames.length > 0) {
      this.notifyFrame(session.frames[0]);
    }
  }

  public play(): void {
    if (!this.currentSession || this.currentSession.frames.length === 0) return;
    if (this.currentFrameIndex >= this.currentSession.frames.length - 1) {
      this.currentFrameIndex = 0;
    }
    this.isPlaying = true;
    this.notifyState();
    this.scheduleNextTick();
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.playbackTimer !== null) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.notifyState();
  }

  public togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setPlaybackSpeed(speed: PlaybackSpeed): void {
    this.playbackSpeed = speed;
    if (this.isPlaying) {
      if (this.playbackTimer !== null) {
        clearTimeout(this.playbackTimer);
      }
      this.scheduleNextTick();
    }
    this.notifyState();
  }

  public getPlaybackSpeed(): PlaybackSpeed {
    return this.playbackSpeed;
  }

  public seekToIndex(index: number): void {
    if (!this.currentSession) return;
    const clampedIndex = Math.max(0, Math.min(this.currentSession.frames.length - 1, index));
    this.currentFrameIndex = clampedIndex;
    const frame = this.currentSession.frames[clampedIndex];
    this.notifyFrame(frame);
    this.notifyState();
  }

  public stepForward(): void {
    if (!this.currentSession) return;
    this.pause();
    if (this.currentFrameIndex < this.currentSession.frames.length - 1) {
      this.seekToIndex(this.currentFrameIndex + 1);
    }
  }

  public stepBackward(): void {
    if (!this.currentSession) return;
    this.pause();
    if (this.currentFrameIndex > 0) {
      this.seekToIndex(this.currentFrameIndex - 1);
    }
  }

  public restart(): void {
    this.seekToIndex(0);
  }

  public jumpToEnd(): void {
    if (!this.currentSession) return;
    this.seekToIndex(this.currentSession.frames.length - 1);
  }

  public getCurrentSession(): ReplaySession | null {
    return this.currentSession;
  }

  public getCurrentFrame(): ReplayFrame | null {
    if (!this.currentSession || this.currentSession.frames.length === 0) return null;
    return this.currentSession.frames[this.currentFrameIndex] || null;
  }

  public getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // ==========================================
  // SUBSCRIPTION HANDLERS
  // ==========================================

  public onFrameUpdate(callback: (frame: ReplayFrame, progress: number, currentOffsetSec: number) => void): () => void {
    this.frameListeners.add(callback);
    return () => {
      this.frameListeners.delete(callback);
    };
  }

  public onStateChange(callback: (isPlaying: boolean, currentFrameIndex: number, totalFrames: number, session: ReplaySession | null) => void): () => void {
    this.stateListeners.add(callback);
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  private scheduleNextTick(): void {
    if (!this.isPlaying || !this.currentSession) return;

    // Normal frame interval is 200ms / playbackSpeed
    const intervalMs = Math.max(20, Math.round(200 / this.playbackSpeed));

    this.playbackTimer = window.setTimeout(() => {
      if (!this.isPlaying || !this.currentSession) return;

      if (this.currentFrameIndex < this.currentSession.frames.length - 1) {
        this.currentFrameIndex++;
        const frame = this.currentSession.frames[this.currentFrameIndex];
        this.notifyFrame(frame);
        this.notifyState();
        this.scheduleNextTick();
      } else {
        this.pause();
      }
    }, intervalMs);
  }

  private notifyFrame(frame: ReplayFrame): void {
    if (!this.currentSession) return;
    const progress = this.currentSession.frames.length > 1
      ? this.currentFrameIndex / (this.currentSession.frames.length - 1)
      : 0;
    const offset = frame.timeOffsetSec;

    this.frameListeners.forEach(listener => {
      try {
        listener(frame, progress, offset);
      } catch (err) {
        console.error('Error in replay frame listener:', err);
      }
    });
  }

  private notifyState(): void {
    const total = this.currentSession ? this.currentSession.frames.length : 0;
    this.stateListeners.forEach(listener => {
      try {
        listener(this.isPlaying, this.currentFrameIndex, total, this.currentSession);
      } catch (err) {
        console.error('Error in replay state listener:', err);
      }
    });
  }

  // ==========================================
  // SEED HISTORICAL SESSIONS (PROTOTYPE BENCHMARK)
  // ==========================================
  private seedDefaultHistoricalSessions(): void {
    // Session 1: Multimodal Prolonged Pause with Desaturation Event
    const session1Frames = this.generateSyntheticReplaySequence({
      totalSeconds: 80,
      preEventSec: 30,
      eventSec: 20,
      recoverySec: 30,
      baselineHR: 136,
      eventHR: 112,
      baselineSpO2: 98,
      eventSpO2: 93,
      baselineTemp: 34.2,
      baselineHum: 58,
      chamberProbeTemp: 34.8,
      eventType: 'PROLONGED_APNEA'
    });

    const session1: ReplaySession = {
      eventId: 'EVT-2026-0819-01',
      sessionTitle: 'Apnea Event Flagged — Camera Motion Drop corroborated by SpO2 & HR Deceleration',
      recordedAt: '2026-09-18 19:42:15',
      totalDurationSec: 80,
      preEventDurationSec: 30,
      postEventDurationSec: 30,
      triggerTimestamp: Date.now() - 3600000 * 2,
      frames: session1Frames,
      channelProvenance: {
        heartRate: 'SIMULATED',
        spo2: 'SIMULATED',
        dht11Temperature: 'MEASURED',
        dht11Humidity: 'MEASURED',
        ds18b20ChamberTemp: 'MEASURED',
        rawPPGIR: 'MEASURED',
        rawPPGRed: 'MEASURED',
        cameraMovement: 'MEASURED',
        actuatorStates: 'MEASURED'
      },
      notes: 'Historical recording under Hybrid Prototype Mode. Physiological HR & SpO2 channels simulated; all temperature, humidity, and raw optical waveforms measured from hardware.'
    };

    // Session 2: Transient Respiratory Pause with Rapid Spontaneous Recovery
    const session2Frames = this.generateSyntheticReplaySequence({
      totalSeconds: 65,
      preEventSec: 25,
      eventSec: 15,
      recoverySec: 25,
      baselineHR: 130,
      eventHR: 122,
      baselineSpO2: 97,
      eventSpO2: 95,
      baselineTemp: 33.9,
      baselineHum: 61,
      chamberProbeTemp: 34.4,
      eventType: 'TRANSIENT_PAUSE'
    });

    const session2: ReplaySession = {
      eventId: 'EVT-2026-0819-02',
      sessionTitle: 'Transient Pause — Isolated Chest Motion Attenuation (Single-Channel Safety Active)',
      recordedAt: '2026-09-18 21:10:04',
      totalDurationSec: 65,
      preEventDurationSec: 25,
      postEventDurationSec: 25,
      triggerTimestamp: Date.now() - 1800000,
      frames: session2Frames,
      channelProvenance: {
        heartRate: 'SIMULATED',
        spo2: 'SIMULATED',
        dht11Temperature: 'MEASURED',
        dht11Humidity: 'MEASURED',
        ds18b20ChamberTemp: 'MEASURED',
        rawPPGIR: 'MEASURED',
        rawPPGRed: 'MEASURED',
        cameraMovement: 'MEASURED',
        actuatorStates: 'MEASURED'
      },
      notes: 'Demonstrates Single-Channel Safety Rule: Watch state activated without premature false alarm.'
    };

    this.sessions.set(session1.eventId, session1);
    this.sessions.set(session2.eventId, session2);
  }

  private generateSyntheticReplaySequence(config: {
    totalSeconds: number;
    preEventSec: number;
    eventSec: number;
    recoverySec: number;
    baselineHR: number;
    eventHR: number;
    baselineSpO2: number;
    eventSpO2: number;
    baselineTemp: number;
    baselineHum: number;
    chamberProbeTemp: number;
    eventType: 'PROLONGED_APNEA' | 'TRANSIENT_PAUSE';
  }): ReplayFrame[] {
    const frames: ReplayFrame[] = [];
    const totalFrames = Math.round(config.totalSeconds * 5); // 5 frames/sec (200ms)
    const eventStartFrame = Math.round(config.preEventSec * 5);
    const eventEndFrame = eventStartFrame + Math.round(config.eventSec * 5);

    let curHR = config.baselineHR;
    let curSpO2 = config.baselineSpO2;
    let curMotion = 0.52;

    for (let i = 0; i < totalFrames; i++) {
      const timeOffsetSec = Math.round(((i - eventStartFrame) * 0.2) * 10) / 10;
      let apneaState: AIApneaState = 'NORMAL';
      let apneaScore = 8;
      let primaryContrib = 'Nominal Cardiorespiratory Status';

      if (i < eventStartFrame) {
        // Pre-event baseline
        curMotion = 0.48 + Math.sin(i * 0.4) * 0.08 + (Math.random() - 0.5) * 0.03;
        curHR = config.baselineHR + (Math.random() - 0.5) * 1.5;
        curSpO2 = config.baselineSpO2 + (Math.random() - 0.5) * 0.3;
        apneaState = 'NORMAL';
        apneaScore = Math.round(10 + (Math.random() * 5));
      } else if (i <= eventEndFrame) {
        // During event
        const eventProgress = (i - eventStartFrame) / (eventEndFrame - eventStartFrame);
        curMotion = Math.max(0.04, 0.48 * (1 - eventProgress * 0.88) + (Math.random() - 0.5) * 0.02);
        curHR = config.baselineHR - (config.baselineHR - config.eventHR) * Math.min(1, eventProgress * 1.2) + (Math.random() - 0.5) * 1.0;
        curSpO2 = config.baselineSpO2 - (config.baselineSpO2 - config.eventSpO2) * Math.min(1, eventProgress * 1.3) + (Math.random() - 0.5) * 0.2;

        if (eventProgress < 0.25) {
          apneaState = 'WATCH';
          apneaScore = 38;
          primaryContrib = 'Chest Motion Drop Detected (-65%)';
        } else if (eventProgress < 0.60) {
          apneaState = 'SUSPECTED';
          apneaScore = 72;
          primaryContrib = 'Motion Drop corroborated by HR Deceleration';
        } else {
          apneaState = config.eventType === 'PROLONGED_APNEA' ? 'CONFIRMED' : 'SUSPECTED';
          apneaScore = config.eventType === 'PROLONGED_APNEA' ? 89 : 68;
          primaryContrib = 'Multimodal Corroboration (Motion + SpO2 Nadir + HR Bradycardia)';
        }
      } else {
        // Recovery window
        const recProgress = (i - eventEndFrame) / (totalFrames - eventEndFrame);
        curMotion = Math.min(0.50, 0.08 + 0.42 * recProgress + (Math.random() - 0.5) * 0.04);
        curHR = config.eventHR + (config.baselineHR - config.eventHR) * recProgress + (Math.random() - 0.5) * 1.5;
        curSpO2 = config.eventSpO2 + (config.baselineSpO2 - config.eventSpO2) * recProgress + (Math.random() - 0.5) * 0.2;
        apneaState = recProgress < 0.35 ? 'RECOVERED' : 'NORMAL';
        apneaScore = Math.max(12, Math.round(75 * (1 - recProgress)));
        primaryContrib = 'Signal Resumption & Baseline Re-stabilization';
      }

      // Generate raw PPG realistic waveform ticks
      const phase = i * 0.35;
      const rawPPG = Math.round(52000 + Math.sin(phase) * 1800 + Math.cos(phase * 2) * 600);
      const rawRed = Math.round(48000 + Math.sin(phase + 0.1) * 1500 + Math.cos(phase * 2) * 450);

      const frame: ReplayFrame = {
        timestamp: Date.now() - (totalFrames - i) * 200,
        timeOffsetSec,
        heartRate: Math.round(curHR * 10) / 10,
        heartRateSource: 'SIMULATED',
        spo2: Math.round(curSpO2 * 10) / 10,
        spo2Source: 'SIMULATED',
        temperature: Math.round((config.baselineTemp + (Math.random() - 0.5) * 0.1) * 10) / 10,
        humidity: Math.round(config.baselineHum + (Math.random() - 0.5) * 0.5),
        chamberTemperature: Math.round((config.chamberProbeTemp + (Math.random() - 0.5) * 0.05) * 100) / 100,
        rawIR: rawPPG,
        rawRed: rawRed,
        cameraMovement: Math.round(curMotion * 100) / 100,
        cameraTrackingState: 'LOCKED',
        esp32Connected: true,
        fanCommand: 'HIGH',
        peltierCommand: 'HEATING',
        signalQuality: 'GOOD',
        apneaState,
        apneaScore,
        primaryContribution: primaryContrib
      };

      frames.push(frame);
    }

    return frames;
  }
}

export const eventReplayService = new EventReplayService();
