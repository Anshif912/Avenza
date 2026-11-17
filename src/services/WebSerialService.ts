import { SignalQuality } from '../types/avenza';

export interface ESP32CommandAck {
  type: 'command_ack';
  command: string;
  accepted: boolean;
  reason: string | null;
  target?: string;
  actualState?: boolean;
  actualFan?: boolean;
  actualPeltier?: boolean;
  safetyInterlockActive?: boolean;
  mode?: string;
  timestamp: number;
}

export interface ESP32TelemetryPacket {
  type: 'telemetry' | 'health' | 'heartbeat';
  deviceId: string;
  firmware: string;
  timestamp: number;
  timestampMs?: number;
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
      ir: number | null;
      red: number | null;
      signalQuality?: string;
      qualityRating: SignalQuality;
      valid?: boolean;
      invalidReason?: string;
      heartRateReason?: string;
      spo2Reason?: string;
      bpmCandidate?: number | null;
      spo2Candidate?: number | null;
      sampleCount?: number;
      qualityScore?: number;
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
      value?: number | null;
      unit?: string;
      valid: boolean;
    };
  };
  actuators: {
    fan?: {
      state: boolean;
      feedback: string;
    };
    thermal?: {
      state: boolean;
      feedback: string;
    };
    fanCommand: boolean;
    peltierCommand: 'OFF' | 'HEATING' | 'COOLING';
    peltierPwm: number;
    safetyCutoff: boolean;
    driverStatus: string;
    manualOverride?: boolean;
  };
  system: {
    transport?: string;
    wifi?: boolean;
    wifiConnected?: boolean;
    connection?: string;
    freeHeap?: number;
    baud?: number;
  };
  ds18b20_temp?: number | null;
  dht_temp?: number | null;
  humidity?: number | null;
  fan?: number | boolean;
  peltier?: number | boolean;
  raw_red?: number | null;
  raw_ir?: number | null;
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
    oled?: boolean;
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

export function normalizeTelemetryPacket(raw: any): ESP32TelemetryPacket | null {
  if (!raw || typeof raw !== 'object' || raw.type !== 'telemetry') {
    return null;
  }

  // 1. Resolve DS18B20 temperature
  let dsTemp: number | null = null;
  let dsValid = false;
  let dsConnected = true;
  if (raw.sensors?.ds18b20) {
    const ds = raw.sensors.ds18b20;
    dsConnected = ds.connected !== undefined ? Boolean(ds.connected) : true;
    if (typeof ds.value === 'number') {
      dsTemp = ds.value;
      dsValid = ds.valid !== undefined ? Boolean(ds.valid) : true;
    } else if (typeof ds.temperature === 'number') {
      dsTemp = ds.temperature;
      dsValid = ds.valid !== undefined ? Boolean(ds.valid) : true;
    }
  } else if (typeof raw.ds18b20_temp === 'number') {
    dsTemp = raw.ds18b20_temp;
    dsValid = true;
  }

  // 2. Resolve DHT11 temperature and humidity
  let dhtTemp: number | null = null;
  let dhtHum: number | null = null;
  let dhtValid = false;
  let dhtConnected = true;
  if (raw.sensors?.dht11) {
    const dht = raw.sensors.dht11;
    dhtConnected = dht.connected !== undefined ? Boolean(dht.connected) : true;
    if (typeof dht.temperature === 'object' && dht.temperature !== null) {
      if (typeof dht.temperature.value === 'number') dhtTemp = dht.temperature.value;
    } else if (typeof dht.temperature === 'number') {
      dhtTemp = dht.temperature;
    }

    if (typeof dht.humidity === 'object' && dht.humidity !== null) {
      if (typeof dht.humidity.value === 'number') dhtHum = dht.humidity.value;
    } else if (typeof dht.humidity === 'number') {
      dhtHum = dht.humidity;
    }

    dhtValid = dht.valid !== undefined ? Boolean(dht.valid) : (dhtTemp !== null || dhtHum !== null);
  } else {
    if (typeof raw.dht_temp === 'number') dhtTemp = raw.dht_temp;
    if (typeof raw.humidity === 'number') dhtHum = raw.humidity;
    dhtValid = dhtTemp !== null || dhtHum !== null;
  }

  // 3. Resolve MAX30102 PPG
  const ppgRaw = raw.sensors?.max30102 || {};
  const rawIR = typeof ppgRaw.ir === 'number' ? ppgRaw.ir : (typeof raw.raw_ir === 'number' ? raw.raw_ir : null);
  const rawRed = typeof ppgRaw.red === 'number' ? ppgRaw.red : (typeof raw.raw_red === 'number' ? raw.raw_red : null);
  const contact = ppgRaw.contact !== undefined ? Boolean(ppgRaw.contact) : (rawIR !== null && rawIR > 40000);
  const ppgConnected = ppgRaw.connected !== undefined ? Boolean(ppgRaw.connected) : (rawIR !== null);
  const hr = typeof ppgRaw.heartRate === 'number' && ppgRaw.heartRate > 0 ? ppgRaw.heartRate : null;
  const hrValid = Boolean(ppgRaw.heartRateValid && hr !== null);
  const spo2 = typeof ppgRaw.spo2 === 'number' && ppgRaw.spo2 > 0 ? ppgRaw.spo2 : null;
  const spo2Valid = Boolean(ppgRaw.spo2Valid && spo2 !== null);
  const rawQuality = ppgRaw.signalQuality || ppgRaw.qualityRating;
  const quality: SignalQuality = (rawQuality === 'EXCELLENT' || rawQuality === 'GOOD' || rawQuality === 'DEGRADED' || rawQuality === 'POOR')
    ? rawQuality
    : (contact ? 'GOOD' : 'POOR');

  // 4. Resolve Actuators
  const actRaw = raw.actuators || {};
  const fanState = Boolean(actRaw.fan?.state ?? actRaw.fanCommand ?? (raw.fan === 1 || raw.fan === true));
  const peltierState: 'OFF' | 'HEATING' | 'COOLING' =
    actRaw.peltierCommand ?? (actRaw.thermal?.state ? 'HEATING' : (raw.peltier === 1 ? 'HEATING' : 'OFF'));
  const safetyCutoff = Boolean(actRaw.safetyCutoff);
  const driverStatus = actRaw.driverStatus || actRaw.thermal?.feedback || (safetyCutoff ? 'CUTOFF_ACTIVE' : 'READY');

  return {
    type: 'telemetry',
    deviceId: String(raw.deviceId || raw.device || 'NEONATTLE_ESP32_01'),
    firmware: String(raw.firmware || '1.2.0'),
    timestamp: Number(raw.timestamp || raw.timestampMs || Date.now()),
    timestampMs: Number(raw.timestampMs || raw.timestamp || Date.now()),
    uptimeMs: Number(raw.uptimeMs || 0),
    sensors: {
      ds18b20: {
        connected: dsConnected,
        temperature: dsTemp,
        value: dsTemp,
        unit: 'C',
        valid: dsValid
      },
      dht11: {
        connected: dhtConnected,
        temperature: dhtTemp,
        humidity: dhtHum,
        valid: dhtValid
      },
      max30102: {
        connected: ppgConnected,
        contact: contact,
        heartRate: hr,
        heartRateValid: hrValid,
        heartRateQuality: Number(ppgRaw.heartRateQuality || 0),
        spo2: spo2,
        spo2Valid: spo2Valid,
        spo2Quality: ppgRaw.spo2Quality !== undefined ? ppgRaw.spo2Quality : null,
        ir: rawIR,
        red: rawRed,
        signalQuality: quality,
        qualityRating: quality,
        valid: Boolean(ppgRaw.valid || (ppgConnected && contact)),
        invalidReason: ppgRaw.invalidReason || (contact ? (hrValid ? 'READY_VALID' : 'ACQUIRING_PULSE') : 'NO_CONTACT'),
        heartRateReason: ppgRaw.heartRateReason || (hrValid ? 'LOCKED' : contact ? 'ACQUIRING' : 'NO_CONTACT'),
        spo2Reason: ppgRaw.spo2Reason || (spo2Valid ? 'VALID' : contact ? 'ACQUIRING' : 'NO_CONTACT'),
        bpmCandidate: typeof ppgRaw.bpmCandidate === 'number' ? ppgRaw.bpmCandidate : null,
        spo2Candidate: typeof ppgRaw.spo2Candidate === 'number' ? ppgRaw.spo2Candidate : null,
        sampleCount: typeof ppgRaw.sampleCount === 'number' ? ppgRaw.sampleCount : 0,
        qualityScore: typeof ppgRaw.qualityScore === 'number' ? ppgRaw.qualityScore : Number(ppgRaw.heartRateQuality || 0)
      }
    },
    actuators: {
      fan: {
        state: fanState,
        feedback: String(actRaw.fan?.feedback || (fanState ? 'Active' : 'Standby'))
      },
      thermal: {
        state: peltierState !== 'OFF',
        feedback: String(actRaw.thermal?.feedback || (peltierState !== 'OFF' ? 'Heating' : 'Standby'))
      },
      fanCommand: fanState,
      peltierCommand: peltierState,
      peltierPwm: Number(actRaw.peltierPwm || (peltierState !== 'OFF' ? 255 : 0)),
      safetyCutoff: safetyCutoff,
      driverStatus: driverStatus,
      manualOverride: Boolean(actRaw.manualOverride ?? raw.mode === 'MANUAL')
    },
    system: {
      transport: 'USB_SERIAL',
      wifi: false,
      connection: 'connected',
      freeHeap: raw.system?.freeHeap,
      baud: Number(raw.system?.baud || 115200)
    },
    ds18b20_temp: dsTemp,
    dht_temp: dhtTemp,
    humidity: dhtHum,
    fan: fanState,
    peltier: peltierState !== 'OFF',
    raw_red: rawRed,
    raw_ir: rawIR
  };
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
  private ackListeners: Array<(ack: ESP32CommandAck) => void> = [];

  constructor() {
    if (this.isSupported()) {
      (navigator as any).serial?.addEventListener('disconnect', (event: any) => {
        if (this.port && event.target === this.port) {
          console.warn('[NEONATTLE-SERIAL] ESP32 USB cable disconnected unexpectedly');
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
      console.error('[NEONATTLE-SERIAL] Connection failed:', err);
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
        console.debug('[NEONATTLE-SERIAL] Reader cancel debug:', e);
      }
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {
        console.debug('[NEONATTLE-SERIAL] Port close debug:', e);
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
          console.error('[NEONATTLE-SERIAL] Read stream error:', error);
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

  public parseLine(line: string): void {
    const firstBrace = line.indexOf('{');
    const lastBrace = line.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      // Diagnostic line (e.g. [BOOT] ..., [HEARTBEAT] ..., etc.) — safely ignore
      return;
    }

    const jsonStr = line.slice(firstBrace, lastBrace + 1);

    try {
      const packet = JSON.parse(jsonStr);
      if (!packet || typeof packet !== 'object') {
        return;
      }

      this.lastPacketTimestamp = Date.now();
      this.packetsReceived++;

      if (packet.type === 'telemetry') {
        const normalized = normalizeTelemetryPacket(packet);
        if (normalized) {
          this.telemetryListeners.forEach(listener => {
            try {
              listener(normalized);
            } catch (err) {
              console.error('[NEONATTLE-SERIAL] Telemetry listener error:', err);
            }
          });
        } else {
          console.warn('[NEONATTLE-SERIAL] INVALID TELEMETRY PACKET: structure validation failed');
        }
      } else if (packet.type === 'command_ack') {
        const ackPacket: ESP32CommandAck = {
          type: 'command_ack',
          command: String(packet.command || ''),
          accepted: Boolean(packet.accepted),
          reason: packet.reason ? String(packet.reason) : null,
          target: packet.target ? String(packet.target) : undefined,
          actualState: packet.actualState !== undefined ? Boolean(packet.actualState) : undefined,
          actualFan: packet.actualFan !== undefined ? Boolean(packet.actualFan) : undefined,
          actualPeltier: packet.actualPeltier !== undefined ? Boolean(packet.actualPeltier) : undefined,
          safetyInterlockActive: packet.safetyInterlockActive !== undefined ? Boolean(packet.safetyInterlockActive) : undefined,
          mode: packet.mode ? String(packet.mode) : undefined,
          timestamp: Date.now()
        };
        this.ackListeners.forEach(listener => {
          try {
            listener(ackPacket);
          } catch (err) {
            console.error('[NEONATTLE-SERIAL] Command ACK listener error:', err);
          }
        });
      } else if (packet.type === 'health') {
        const healthPacket = packet as ESP32HealthPacket;
        this.healthListeners.forEach(listener => {
          try {
            listener(healthPacket);
          } catch (err) {
            console.error('[NEONATTLE-SERIAL] Health listener error:', err);
          }
        });
      }
    } catch (err) {
      // Malformed JSON segment — gracefully discard without crashing
      console.warn('[NEONATTLE-SERIAL] INVALID TELEMETRY PACKET discarded:', jsonStr);
    }
  }

  public feedChunkForTesting(chunk: string): void {
    this.processIncomingChunk(chunk);
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
      console.error('[NEONATTLE-SERIAL] Failed to write serial command:', err);
      return false;
    }
  }

  public async sendFanCommand(on: boolean): Promise<boolean> {
    return this.sendJson({
      type: 'command',
      command: 'SET_FAN',
      target: 'fan',
      action: on ? 'ON' : 'OFF',
      state: on,
      value: on
    });
  }

  public async sendPeltierCommand(mode: 'OFF' | 'HEATING' | 'COOLING', pwm: number = 255): Promise<boolean> {
    const on = mode !== 'OFF';
    return this.sendJson({
      type: 'command',
      command: 'SET_PELTIER',
      target: 'peltier',
      action: on ? 'HEATING' : 'OFF',
      state: on,
      mode,
      pwm
    });
  }

  public async setModeCommand(mode: 'AUTO' | 'MANUAL'): Promise<boolean> {
    return this.sendJson({
      type: 'command',
      command: 'SET_MODE',
      target: 'mode',
      mode
    });
  }

  public async resetSafetyCommand(): Promise<boolean> {
    return this.sendJson({
      type: 'command',
      command: 'RESET_SAFETY'
    });
  }

  public onCommandAck(listener: (ack: ESP32CommandAck) => void): () => void {
    this.ackListeners.push(listener);
    return () => {
      this.ackListeners = this.ackListeners.filter(l => l !== listener);
    };
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
