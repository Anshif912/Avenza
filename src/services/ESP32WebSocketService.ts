import { SignalQuality } from '../types/avenza';

export interface ESP32TelemetryPacket {
  type: 'telemetry' | 'health' | 'heartbeat';
  deviceId: string;
  firmware: string;
  timestamp: number;
  uptimeMs: number;
  sensors: {
    max30102: {
      connected: boolean;
      contact: boolean;
      heartRate: number | null;
      heartRateValid: boolean;
      heartRateQuality: number;
      spo2: number | null;
      spo2Valid: boolean;
      spo2Quality: number;
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
  actuators: {
    fanCommand: boolean;
    peltierCommand: 'OFF' | 'HEATING' | 'COOLING';
    peltierPwm: number;
    safetyCutoff: boolean;
    driverStatus: string;
  };
  system: {
    wifiConnected: boolean;
    wifiRssi: number;
    ipAddress?: string;
    freeHeap: number;
    wsClients: number;
  };
}

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export class ESP32WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = 'ws://192.168.1.120:8080';
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
      this.url = `${cleanUrl}:${port}`;
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
      };

      this.ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data) as ESP32TelemetryPacket;
          if (packet.type === 'telemetry') {
            this.telemetryListeners.forEach(listener => listener(packet));
          }
        } catch (e) {
          console.warn('[AVENZA-WS] Non-JSON payload received:', event.data);
        }
      };

      this.ws.onerror = (err) => {
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
      type: 'command',
      target: 'fan',
      value: on
    });
  }

  public sendPeltierCommand(mode: 'OFF' | 'HEATING' | 'COOLING', pwm: number = 120) {
    this.sendJson({
      type: 'command',
      target: 'peltier',
      mode,
      pwm
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
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectTimer = setTimeout(() => {
      if (this.autoReconnect) {
        this.connect();
      }
    }, delay);
  }
}

export const esp32WebSocketService = new ESP32WebSocketService();
