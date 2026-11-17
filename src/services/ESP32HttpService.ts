/**
 * NeoNattle — ESP32 Wi-Fi HTTP REST API Client Service (Developed by Avenza)
 * 
 * Provides robust, non-blocking HTTP polling, live data ingestion,
 * history retrieval, threshold configuration, and safe actuator command dispatch.
 */

export interface ESP32HealthData {
  status: string;
  device_id: string;
  device_name: string;
  firmware_version: string;
  uptime_ms: number;
  uptime_sec: number;
  wifi: {
    connected: boolean;
    ip: string;
    ssid: string;
    rssi: number;
  };
  sensors: {
    dht11: { available: boolean };
    ds18b20: { available: boolean };
    max30102: { available: boolean };
    oled?: { available: boolean };
  };
  actuators: {
    fan_relay: { gpio: number; active_low: boolean };
    peltier_relay: { gpio: number; active_low: boolean };
  };
  system: {
    free_heap: number;
    min_free_heap?: number;
  };
}

export interface ESP32TelemetryData {
  device: string;
  timestamp: number;
  uptime_ms: number;
  uptime_sec: number;
  mode: 'AUTO' | 'MANUAL';
  sensors: {
    temperature_probe: number | null;
    air_temperature: number | null;
    humidity: number | null;
    active_temperature: number | null;
    active_temperature_source: 'ds18b20' | 'dht11' | 'none';
    max30102: {
      available: boolean;
      contact: boolean;
      raw_ir: number;
      raw_red: number;
      experimental_note: string;
    };
  };
  actuators: {
    fan: boolean;
    peltier: boolean;
    fan_reason: string;
    peltier_reason: string;
    driver_status: string;
  };
  safety: {
    emergency_cutoff_active: boolean;
    heatsink_fan_interlock: boolean;
    emergency_cutoff_threshold_c: number;
    failsafe_status: string;
  };
}

export interface ESP32HistorySample {
  uptime_sec: number;
  probe_temp: number | null;
  air_temp: number | null;
  humidity: number | null;
  fan: boolean;
  peltier: boolean;
}

export interface ESP32HistoryData {
  device: string;
  count: number;
  capacity: number;
  sample_interval_ms: number;
  samples: ESP32HistorySample[];
}

export interface ESP32ConfigData {
  device_name: string;
  device_id: string;
  firmware_version: string;
  mode: 'AUTO' | 'MANUAL';
  target_threshold_c: number;
  hysteresis_c: number;
  emergency_cutoff_c: number;
  manual_timeout_sec: number;
  primary_temp_sensor: string;
  fallback_temp_sensor: string;
  heatsink_fan_interlock: boolean;
  relay_active_low: boolean;
  pinout: {
    dht11_gpio: number;
    ds18b20_gpio: number;
    max30102_sda: number;
    max30102_scl: number;
    oled_sda?: number;
    oled_scl?: number;
    relay_fan_gpio: number;
    relay_peltier_gpio: number;
  };
  disclaimer: string;
}

export interface ESP32ControlCommand {
  mode?: 'AUTO' | 'MANUAL';
  fan?: boolean;
  peltier?: boolean;
}

export interface ESP32ControlResponse {
  success: boolean;
  mode: string;
  fan: boolean;
  peltier: boolean;
  driver_status: string;
  error?: string;
}

export type HttpConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'DEGRADED' | 'ERROR';

export interface PrototypeEvent {
  id: string;
  timestamp: string;
  type: 'CONNECTION' | 'SENSOR' | 'THRESHOLD' | 'CONTROL' | 'SAFETY';
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

const STORAGE_KEY_BASE_URL = 'neonattle_esp32_base_url';
const STORAGE_KEY_BASE_URL_LEGACY = 'avenza_esp32_base_url';
const STORAGE_KEY_POLL_INTERVAL = 'neonattle_esp32_poll_interval';
const STORAGE_KEY_POLL_INTERVAL_LEGACY = 'avenza_esp32_poll_interval';

export class ESP32HttpService {
  private baseUrl: string;
  private pollingIntervalMs: number = 1000;
  private isPollingActive: boolean = false;
  private pollTimer: any = null;
  private connectionState: HttpConnectionState = 'DISCONNECTED';
  private consecutiveFailures: number = 0;
  private lastLatencyMs: number = 0;
  private packetsReceived: number = 0;
  private lastUpdated: string | null = null;
  private lastReportedMode: string = 'AUTO';
  private lastReportedFan: boolean = false;
  private lastReportedPeltier: boolean = false;

  private telemetryListeners: Array<(data: ESP32TelemetryData) => void> = [];
  private stateListeners: Array<(state: HttpConnectionState) => void> = [];
  private eventListeners: Array<(event: PrototypeEvent) => void> = [];

  constructor() {
    // 1. Check localStorage (supporting NeoNattle and legacy Avenza key), Vite proxy fallback, or default
    const savedUrl = typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY_BASE_URL) || localStorage.getItem(STORAGE_KEY_BASE_URL_LEGACY))
      : null;
    const savedInterval = typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY_POLL_INTERVAL) || localStorage.getItem(STORAGE_KEY_POLL_INTERVAL_LEGACY))
      : null;

    if (savedUrl) {
      this.baseUrl = savedUrl;
    } else {
      // Default to Vite dev proxy path in browser, or direct IP
      this.baseUrl = typeof window !== 'undefined' && window.location.origin
        ? `${window.location.origin}/api/esp32`
        : 'http://localhost:8080';
    }

    if (savedInterval) {
      const parsed = parseInt(savedInterval, 10);
      if (!isNaN(parsed) && parsed >= 300) {
        this.pollingIntervalMs = parsed;
      }
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    let clean = url.trim();
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    this.baseUrl = clean;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_BASE_URL, clean);
    }
    // Re-verify connection if active
    if (this.isPollingActive) {
      this.fetchData();
    }
  }

  public getPollingInterval(): number {
    return this.pollingIntervalMs;
  }

  public setPollingInterval(ms: number) {
    this.pollingIntervalMs = Math.max(300, ms);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_POLL_INTERVAL, String(this.pollingIntervalMs));
    }
    if (this.isPollingActive) {
      this.restartPollingTimer();
    }
  }

  public getState(): HttpConnectionState {
    return this.connectionState;
  }

  public getStats() {
    return {
      packetsReceived: this.packetsReceived,
      lastLatencyMs: this.lastLatencyMs,
      lastUpdated: this.lastUpdated,
      consecutiveFailures: this.consecutiveFailures
    };
  }

  public startPolling() {
    if (this.isPollingActive) return;
    this.isPollingActive = true;
    this.consecutiveFailures = 0;
    this.updateState('CONNECTING');
    this.pollNow();
  }

  public stopPolling() {
    this.isPollingActive = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.updateState('DISCONNECTED');
  }

  private restartPollingTimer() {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (!this.isPollingActive) return;

    // Exponential backoff if consecutive errors occur
    const backoffMultiplier = Math.min(Math.pow(1.5, Math.min(this.consecutiveFailures, 5)), 6);
    const delay = Math.round(this.pollingIntervalMs * backoffMultiplier);

    this.pollTimer = setTimeout(() => {
      this.pollNow();
    }, delay);
  }

  private async pollNow() {
    if (!this.isPollingActive) return;

    try {
      const startTime = performance.now();
      const data = await this.fetchData();
      this.lastLatencyMs = Math.round(performance.now() - startTime);
      this.packetsReceived++;
      this.lastUpdated = new Date().toISOString();

      if (this.consecutiveFailures > 0) {
        this.addEvent('CONNECTION', `ESP32 connection restored (${this.baseUrl})`, 'INFO');
      }
      this.consecutiveFailures = 0;

      // Check sensor degradation
      if (data.sensors.temperature_probe === null && data.sensors.air_temperature === null) {
        this.updateState('DEGRADED');
      } else {
        this.updateState('CONNECTED');
      }

      // Check threshold events
      if (data.sensors.active_temperature !== null && data.sensors.active_temperature >= 30.0) {
        // Temperature above prototype threshold
      }

      // Check state change events
      if (data.mode !== this.lastReportedMode) {
        this.addEvent('CONTROL', `Mode changed to ${data.mode}`, 'INFO');
        this.lastReportedMode = data.mode;
      }
      if (data.actuators.fan !== this.lastReportedFan) {
        this.addEvent('CONTROL', `Fan switched ${data.actuators.fan ? 'ON' : 'OFF'} (${data.actuators.fan_reason})`, 'INFO');
        this.lastReportedFan = data.actuators.fan;
      }
      if (data.actuators.peltier !== this.lastReportedPeltier) {
        this.addEvent('CONTROL', `Peltier switched ${data.actuators.peltier ? 'ON' : 'OFF'} (${data.actuators.peltier_reason})`, 'INFO');
        this.lastReportedPeltier = data.actuators.peltier;
      }

      // Emit telemetry to subscribers
      this.telemetryListeners.forEach(cb => cb(data));
    } catch (err: any) {
      this.consecutiveFailures++;
      if (this.consecutiveFailures === 1) {
        this.addEvent('CONNECTION', `Lost connection to ESP32 at ${this.baseUrl}: ${err.message}`, 'WARNING');
      }
      this.updateState(this.consecutiveFailures >= 3 ? 'ERROR' : 'CONNECTING');
    } finally {
      if (this.isPollingActive) {
        this.restartPollingTimer();
      }
    }
  }

  /* ------------------------------------------------------------
     API Methods
     ------------------------------------------------------------ */

  public async fetchHealth(): Promise<ESP32HealthData> {
    const res = await fetch(`${this.baseUrl}/api/health`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  }

  public async fetchData(): Promise<ESP32TelemetryData> {
    const res = await fetch(`${this.baseUrl}/api/data`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(2500)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  }

  public async fetchHistory(): Promise<ESP32HistoryData> {
    const res = await fetch(`${this.baseUrl}/api/history`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  }

  public async fetchConfig(): Promise<ESP32ConfigData> {
    const res = await fetch(`${this.baseUrl}/api/config`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  }

  public async sendControl(command: ESP32ControlCommand): Promise<ESP32ControlResponse> {
    const res = await fetch(`${this.baseUrl}/api/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(4000)
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data.error || `Command rejected with HTTP ${res.status}`;
      this.addEvent('CONTROL', `Command failed: ${msg}`, 'WARNING');
      throw new Error(msg);
    }

    this.addEvent('CONTROL', `Command applied: mode=${data.mode}, fan=${data.fan ? 'ON' : 'OFF'}, peltier=${data.peltier ? 'ON' : 'OFF'}`, 'INFO');
    // Immediately refresh state
    this.pollNow();
    return data;
  }

  /* ------------------------------------------------------------
     Event & State Subscription
     ------------------------------------------------------------ */

  public onTelemetry(cb: (data: ESP32TelemetryData) => void): () => void {
    this.telemetryListeners.push(cb);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter(l => l !== cb);
    };
  }

  public onStateChange(cb: (state: HttpConnectionState) => void): () => void {
    this.stateListeners.push(cb);
    cb(this.connectionState);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== cb);
    };
  }

  public onEvent(cb: (event: PrototypeEvent) => void): () => void {
    this.eventListeners.push(cb);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== cb);
    };
  }

  private updateState(state: HttpConnectionState) {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.stateListeners.forEach(cb => cb(state));
    }
  }

  private addEvent(type: PrototypeEvent['type'], message: string, severity: PrototypeEvent['severity']) {
    const event: PrototypeEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      severity
    };
    this.eventListeners.forEach(cb => cb(event));
  }
}

export const esp32HttpService = new ESP32HttpService();
