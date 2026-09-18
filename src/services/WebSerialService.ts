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
  actuators: {
    fanCommand: boolean;
    peltierCommand: 'OFF' | 'HEATING' | 'COOLING';
    peltierPwm: number;
    safetyCutoff: boolean;
    driverStatus: string;
  };
  system: {
    wifiConnected?: boolean;
    freeHeap?: number;
    baud?: number;
  };
}

export interface ESP32HealthPacket {
  type: 'health';
  deviceId: string;
  firmware: string;
  uptimeMs: number;
  sensors: {
    max30102: boolean;
    dht11: boolean;
    ds18b20: boolean;
    oled: boolean;
  };
  system: {
    freeHeap?: number;
    baud?: number;
  };
}

export type SerialConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

export class WebSerialService {
  private port: any = null;
  private reader: any = null;
  private keepReading: boolean = false;
  private connectionState: SerialConnectionState = 'DISCONNECTED';
  private portInfo: SerialPortInfo = {};
  
  private packetsReceived: number = 0;
  private lastPacketTimestamp: number = 0;
  private lineBuffer: string = '';

  private telemetryListeners: Array<(data: ESP32TelemetryPacket) => void> = [];
  private healthListeners: Array<(data: ESP32HealthPacket) => void> = [];
  private stateListeners: Array<(state: SerialConnectionState) => void> = [];
  private errorListeners: Array<(error: string) => void> = [];

  constructor() {
    if (this.isSupported()) {
      (navigator as any).serial?.addEventListener('disconnect', (event: any) => {
        if (this.port && event.target === this.port) {
          console.warn('[AVENZA-SERIAL] ESP32 USB cable disconnected unexpectedly');
          this.handleDisconnect('Hardware device disconnected from USB port');
        }
      });
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public getState(): SerialConnectionState {
    return this.connectionState;
  }

  public getPortInfo(): SerialPortInfo {
    return this.portInfo;
  }

  public getStats() {
    return {
      packetsReceived: this.packetsReceived,
      lastPacketTimestamp: this.lastPacketTimestamp,
      dataAgeMs: this.lastPacketTimestamp > 0 ? Date.now() - this.lastPacketTimestamp : null,
      state: this.connectionState
    };
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      this.notifyError('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
      this.updateState('ERROR');
      return false;
    }

    if (this.connectionState === 'CONNECTED' || this.connectionState === 'CONNECTING') {
      return true;
    }

    this.updateState('CONNECTING');

    try {
      // Prompt user to select ESP32 COM port
      this.port = await (navigator as any).serial.requestPort();
      
      const info = this.port.getInfo ? this.port.getInfo() : {};
      this.portInfo = {
        usbVendorId: info.usbVendorId,
        usbProductId: info.usbProductId
      };

      // Open port at 115200 baud
      await this.port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        bufferSize: 8192
      });

      this.keepReading = true;
      this.packetsReceived = 0;
      this.lineBuffer = '';
      this.updateState('CONNECTED');

      // Start continuous background read loop
      this.startReadLoop();
      return true;
    } catch (err: any) {
      console.error('[AVENZA-SERIAL] Connection failed:', err);
      const errMsg = err?.message || 'Failed to open serial port';
      this.notifyError(errMsg.includes('User cancelled') ? 'Port selection cancelled by user' : errMsg);
      this.handleDisconnect(errMsg);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.keepReading = false;
    
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {
        console.debug('[AVENZA-SERIAL] Reader cancel debug:', e);
      }
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {
        console.debug('[AVENZA-SERIAL] Port close debug:', e);
      }
      this.port = null;
    }

    this.reader = null;
    this.updateState('DISCONNECTED');
  }

  private async startReadLoop(): Promise<void> {
    const textDecoder = new TextDecoder();

    while (this.port && this.port.readable && this.keepReading) {
      try {
        this.reader = this.port.readable.getReader();

        while (this.keepReading) {
          const { value, done } = await this.reader.read();
          if (done) {
            break;
          }
          if (value) {
            const chunk = textDecoder.decode(value, { stream: true });
            this.processIncomingChunk(chunk);
          }
        }
      } catch (error: any) {
        if (this.keepReading) {
          console.error('[AVENZA-SERIAL] Read stream error:', error);
          this.handleDisconnect(error?.message || 'Serial read error');
        }
      } finally {
        if (this.reader) {
          try {
            this.reader.releaseLock();
          } catch (e) {
            // Ignored
          }
          this.reader = null;
        }
      }
    }
  }

  private processIncomingChunk(chunk: string): void {
    this.lineBuffer += chunk;

    let newlineIndex = this.lineBuffer.indexOf('\n');
    while (newlineIndex >= 0) {
      const line = this.lineBuffer.slice(0, newlineIndex).trim();
      this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);

      if (line.length > 0) {
        this.parseLine(line);
      }

      newlineIndex = this.lineBuffer.indexOf('\n');
    }

    // Guard against buffer unbounded growth in case of malformed stream without newlines
    if (this.lineBuffer.length > 16384) {
      this.lineBuffer = '';
    }
  }

  private parseLine(line: string): void {
    if (!line.startsWith('{') || !line.endsWith('}')) {
      // Diagnostic or non-JSON banner line — safe to ignore
      return;
    }

    try {
      const packet = JSON.parse(line);
      this.lastPacketTimestamp = Date.now();
      this.packetsReceived++;

      if (packet.type === 'telemetry') {
        const telemetryPacket = packet as ESP32TelemetryPacket;
        this.telemetryListeners.forEach(listener => {
          try {
            listener(telemetryPacket);
          } catch (err) {
            console.error('[AVENZA-SERIAL] Telemetry listener error:', err);
          }
        });
      } else if (packet.type === 'health') {
        const healthPacket = packet as ESP32HealthPacket;
        this.healthListeners.forEach(listener => {
          try {
            listener(healthPacket);
          } catch (err) {
            console.error('[AVENZA-SERIAL] Health listener error:', err);
          }
        });
      }
    } catch (err) {
      // Malformed JSON segment — gracefully discard
      console.warn('[AVENZA-SERIAL] Corrupted JSON line discarded:', line);
    }
  }

  public async sendJson(payload: any): Promise<boolean> {
    if (!this.port || !this.port.writable || this.connectionState !== 'CONNECTED') {
      return false;
    }

    try {
      const writer = this.port.writable.getWriter();
      const textEncoder = new TextEncoder();
      const data = textEncoder.encode(JSON.stringify(payload) + '\n');
      await writer.write(data);
      writer.releaseLock();
      return true;
    } catch (err) {
      console.error('[AVENZA-SERIAL] Failed to write serial command:', err);
      return false;
    }
  }

  public async sendFanCommand(on: boolean): Promise<boolean> {
    return this.sendJson({
      type: 'command',
      target: 'fan',
      action: on ? 'ON' : 'OFF',
      value: on
    });
  }

  public async sendPeltierCommand(mode: 'OFF' | 'HEATING' | 'COOLING', pwm: number = 120): Promise<boolean> {
    return this.sendJson({
      type: 'command',
      target: 'peltier',
      action: mode === 'OFF' ? 'OFF' : 'SET_POWER',
      mode,
      pwm
    });
  }

  public onTelemetry(listener: (data: ESP32TelemetryPacket) => void): () => void {
    this.telemetryListeners.push(listener);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter(l => l !== listener);
    };
  }

  public onHealth(listener: (data: ESP32HealthPacket) => void): () => void {
    this.healthListeners.push(listener);
    return () => {
      this.healthListeners = this.healthListeners.filter(l => l !== listener);
    };
  }

  public onStateChange(listener: (state: SerialConnectionState) => void): () => void {
    this.stateListeners.push(listener);
    listener(this.connectionState);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  public onError(listener: (error: string) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  private updateState(state: SerialConnectionState) {
    this.connectionState = state;
    this.stateListeners.forEach(listener => listener(state));
  }

  private notifyError(error: string) {
    this.errorListeners.forEach(listener => listener(error));
  }

  private handleDisconnect(reason?: string) {
    this.disconnect();
    this.updateState('DISCONNECTED');
    if (reason) {
      this.notifyError(reason);
    }
  }
}

export const webSerialService = new WebSerialService();
