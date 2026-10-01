import { SignalQuality } from '../types/avenza';

export interface ESP32TelemetryPacket {
  type: 'telemetry' | 'health' | 'heartbeat' | 'unified_telemetry';
  deviceId?: string;
  firmware?: string;
  timestamp: number;
  uptimeMs?: number;
  sensors?: {
    max30102: {
      connected: boolean;
      contact: boolean;
      heartRate: number | null;
      heartRateValid: boolean;
      heartRateQuality: number;
      spo2: number | null;
      spo2Valid: boolean;
      spo2Quality: number | null;
      ir: number;
      red: number;
      qualityRating: SignalQuality;
    };
    dht11: {
      connected: boolean;
      temperature: number | null;
      humidity: number | null;
      valid: boolean;
    };
    ds18b20: {
      connected: boolean;
      temperature: number | null;
      valid: boolean;
    };
  };
  actuators?: {
    fanCommand: boolean;
    peltierCommand: 'OFF' | 'HEATING' | 'COOLING';
    peltierPwm: number;
    safetyCutoff: boolean;
    driverStatus: string;
  };
  system?: {
    freeHeap?: number;
    baud?: number;
  };
  // Optional AI inference fields if streamed from unified backend
  hardware?: any;
  camera?: any;
  inference?: {
    status: string;
    state: string;
    apnea_score: number;
    is_alert: boolean;
    event_type: string;
    event_duration_sec: number;
    current_vitals: {
      heart_rate: number;
      spo2: number;
      perfusion_index: number;
    };
    signal_quality: {
      ppg_sqi: number;
      video_sqi: number;
      is_ppg_valid: boolean;
      is_video_valid: boolean;
    };
    evidence_weights: {
      video_weight: number;
      ppg_weight: number;
    };
    attribution: {
      video_contribution_pct: number;
      spo2_contribution_pct: number;
      hr_contribution_pct: number;
      clinical_summary: string;
    };
    reason: string;
    prototype_disclaimer: string;
  };
}

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export class ESP32WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = 'ws://localhost:8000/ws/dashboard';
  private connectionState: ConnectionState = 'DISCONNECTED';
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private autoReconnect: boolean = true;
  
  private telemetryListeners: Array<(data: ESP32TelemetryPacket) => void> = [];
  private stateListeners: Array<(state: ConnectionState) => void> = [];

  constructor(defaultUrl?: string) {
    if (defaultUrl) this.url = defaultUrl;
  }

  public setUrl(url: string, port?: number) {
    if (port && !url.includes(`:${port}`)) {
      const cleanUrl = url.replace(/\/+$/, '');
      this.url = `${cleanUrl}:${port}/ws/dashboard`;
    } else {
      this.url = url;
    }
  }

  public connect(customUrl?: string) {
    if (customUrl) this.url = customUrl;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateState('CONNECTING');
    this.autoReconnect = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateState('CONNECTED');
        console.log(`[AVENZA-WS] Connected to AI Backend & Telemetry Stream at ${this.url}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data) as ESP32TelemetryPacket;
          if (packet.type === 'telemetry' || packet.type === 'unified_telemetry') {
            this.telemetryListeners.forEach(listener => listener(packet));
          }
        } catch (e) {
          console.warn('[AVENZA-WS] Non-JSON payload received:', event.data);
        }
      };

      this.ws.onerror = () => {
        this.updateState('ERROR');
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (this.autoReconnect) {
          this.updateState('RECONNECTING');
          this.scheduleReconnect();
        } else {
          this.updateState('DISCONNECTED');
        }
      };
    } catch (err) {
      this.updateState('ERROR');
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.autoReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateState('DISCONNECTED');
  }

  public sendFanCommand(on: boolean) {
    this.sendJson({
      action: 'fan',
      target: 'fan',
      value: on
    });
  }

  public sendPeltierCommand(mode: 'OFF' | 'HEATING' | 'COOLING', pwm: number = 180) {
    this.sendJson({
      action: 'peltier',
      target: 'peltier',
      mode,
      pwm
    });
  }

  public sendAutoCommand() {
    this.sendJson({
      action: 'auto',
      target: 'auto'
    });
  }

  public sendJson(payload: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  public onTelemetry(listener: (data: ESP32TelemetryPacket) => void) {
    this.telemetryListeners.push(listener);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter(l => l !== listener);
    };
  }

  public onStateChange(listener: (state: ConnectionState) => void) {
    this.stateListeners.push(listener);
    listener(this.connectionState);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  public getState(): ConnectionState {
    return this.connectionState;
  }

  private updateState(state: ConnectionState) {
    this.connectionState = state;
    this.stateListeners.forEach(listener => listener(state));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectTimer = setTimeout(() => {
      if (this.autoReconnect) {
        this.connect();
      }
    }, delay);
  }
}

export const esp32WebSocketService = new ESP32WebSocketService();
