/**
 * AVENZA — Web Serial Telemetry Parser & Stream Ingestion Test Suite
 * 
 * Verifies:
 * 1. Valid single packet parsing & normalization (ESP32 USB-Serial schema)
 * 2. Split/fragmented packet across read chunks (line buffer reconstruction)
 * 3. Multiple packets in a single read chunk
 * 4. Malformed JSON handling without crashing
 * 5. Diagnostic lines ([BOOT], [HEARTBEAT], etc.) safely ignored
 * 6. Missing and null field handling (Real-data purity: no fabricated HR/SpO2)
 * 7. Telemetry freshness & watchdog logic (LIVE vs STALE)
 */

// Implementation of Parser & Normalization mirroring WebSerialService
export function normalizeTelemetryPacket(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const sens = raw.sensors || {};
  const actRaw = raw.actuators || {};

  // DS18B20 parsing
  let dsTemp = null;
  let dsConnected = false;
  let dsValid = false;
  if (sens.ds18b20) {
    if (typeof sens.ds18b20 === 'object') {
      dsTemp = typeof sens.ds18b20.temperature === 'number' ? sens.ds18b20.temperature : (typeof sens.ds18b20.value === 'number' ? sens.ds18b20.value : null);
      dsConnected = Boolean(sens.ds18b20.connected ?? (dsTemp !== null));
      dsValid = Boolean(sens.ds18b20.valid ?? (dsTemp !== null && dsConnected));
    } else if (typeof sens.ds18b20 === 'number') {
      dsTemp = sens.ds18b20;
      dsConnected = true;
      dsValid = true;
    }
  } else if (typeof raw.ds18b20_temp === 'number') {
    dsTemp = raw.ds18b20_temp;
    dsConnected = true;
    dsValid = true;
  }

  // DHT11 parsing
  let dhtTemp = null;
  let dhtHum = null;
  let dhtConnected = false;
  let dhtValid = false;
  if (sens.dht11 && typeof sens.dht11 === 'object') {
    dhtTemp = typeof sens.dht11.temperature === 'object' ? sens.dht11.temperature?.value : (typeof sens.dht11.temperature === 'number' ? sens.dht11.temperature : null);
    dhtHum = typeof sens.dht11.humidity === 'object' ? sens.dht11.humidity?.value : (typeof sens.dht11.humidity === 'number' ? sens.dht11.humidity : null);
    dhtConnected = Boolean(sens.dht11.connected ?? (dhtTemp !== null || dhtHum !== null));
    dhtValid = Boolean(sens.dht11.valid ?? (dhtConnected && dhtTemp !== null));
  } else {
    if (typeof raw.dht_temp === 'number') {
      dhtTemp = raw.dht_temp;
      dhtConnected = true;
      dhtValid = true;
    }
    if (typeof raw.humidity === 'number') {
      dhtHum = raw.humidity;
      dhtConnected = true;
    }
  }

  // MAX30102 PPG parsing
  const ppgRaw = sens.max30102 || {};
  const ppgConnected = Boolean(ppgRaw.connected ?? (raw.raw_ir !== undefined || ppgRaw.ir !== undefined));
  const contact = Boolean(ppgRaw.contact ?? (ppgRaw.valid && (ppgRaw.ir > 50000 || raw.raw_ir > 50000)));

  const rawIR = typeof ppgRaw.ir === 'number' ? ppgRaw.ir : (typeof raw.raw_ir === 'number' ? raw.raw_ir : 0);
  const rawRed = typeof ppgRaw.red === 'number' ? ppgRaw.red : (typeof raw.raw_red === 'number' ? raw.raw_red : 0);

  let hr = null;
  let hrValid = false;
  if (typeof ppgRaw.heartRate === 'number' && ppgRaw.heartRate > 0 && ppgRaw.heartRateValid !== false) {
    hr = ppgRaw.heartRate;
    hrValid = Boolean(ppgRaw.heartRateValid ?? true);
  }

  let spo2 = null;
  let spo2Valid = false;
  if (typeof ppgRaw.spo2 === 'number' && ppgRaw.spo2 > 0 && ppgRaw.spo2Valid !== false) {
    spo2 = ppgRaw.spo2;
    spo2Valid = Boolean(ppgRaw.spo2Valid ?? true);
  }

  const quality = ppgRaw.qualityRating || ppgRaw.signalQuality || (contact ? 'GOOD' : 'POOR');

  // Actuators parsing
  const fanState = Boolean(actRaw.fan?.state ?? actRaw.fanCommand ?? raw.fan ?? false);
  let peltierState = 'OFF';
  if (typeof actRaw.peltierCommand === 'string') {
    peltierState = actRaw.peltierCommand;
  } else if (actRaw.thermal?.state !== undefined) {
    peltierState = actRaw.thermal.state ? 'HEATING' : 'OFF';
  } else if (raw.peltier !== undefined) {
    peltierState = raw.peltier ? 'HEATING' : 'OFF';
  }

  const safetyCutoff = Boolean(actRaw.safetyCutoff ?? false);
  const driverStatus = actRaw.driverStatus || (peltierState !== 'OFF' ? 'Active' : 'Standby');

  return {
    type: 'telemetry',
    deviceId: String(raw.deviceId || raw.device || 'AVENZA_ESP32_01'),
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

export class StreamBufferParser {
  constructor(onPacket, onAck = null) {
    this.buffer = '';
    this.onPacket = onPacket;
    this.onAck = onAck;
    this.errorsCount = 0;
  }

  feedChunk(chunk) {
    this.buffer += chunk;
    let newlineIndex = this.buffer.indexOf('\n');
    while (newlineIndex >= 0) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.length > 0) {
        this.parseLine(line);
      }
      newlineIndex = this.buffer.indexOf('\n');
    }

    if (this.buffer.length > 16384) {
      this.buffer = '';
    }
  }

  parseLine(line) {
    const firstBrace = line.indexOf('{');
    const lastBrace = line.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      // Diagnostic line (e.g. [BOOT] ..., [HEARTBEAT] ...)
      return;
    }

    const jsonStr = line.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        if (parsed.type === 'command_ack') {
          if (this.onAck) {
            this.onAck(parsed);
          }
          return;
        }
        const normalized = normalizeTelemetryPacket(parsed);
        if (normalized) {
          this.onPacket(normalized);
        }
      }
    } catch (e) {
      this.errorsCount++;
      // Graceful discard
    }
  }
}

// ============================================================
// TEST RUNNER
// ============================================================

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('============================================================');
console.log('  AVENZA USB-SERIAL TELEMETRY PARSER TEST SUITE');
console.log('  Validates Stream Ingestion, Data Integrity & Robustness');
console.log('============================================================\n');

// TEST 1: Full Valid Telemetry Packet from ESP32 Firmware
console.log('[TEST 1] Standard 1 Hz Telemetry Packet Parsing & Normalization');
{
  const packets = [];
  const parser = new StreamBufferParser(p => packets.push(p));
  
  const sampleJson = JSON.stringify({
    type: "telemetry",
    deviceId: "AVENZA_ESP32_01",
    firmware: "1.2.0",
    uptimeMs: 145020,
    timestampMs: 1727850000000,
    sensors: {
      ds18b20: { connected: true, valid: true, temperature: 36.85, value: 36.85, unit: "C" },
      dht11: { connected: true, valid: true, temperature: 27.4, humidity: 55.0 },
      max30102: {
        connected: true, contact: true, valid: true,
        ir: 65200, red: 64100,
        heartRate: 138.5, heartRateValid: true, heartRateQuality: 0.94,
        spo2: 97.2, spo2Valid: true, spo2Quality: 0.92,
        signalQuality: "GOOD", qualityRating: "GOOD"
      }
    },
    actuators: {
      fan: { state: false, feedback: "Fan standby" },
      thermal: { state: true, feedback: "Peltier heating" },
      fanCommand: false,
      peltierCommand: "HEATING",
      peltierPwm: 255,
      safetyCutoff: false,
      manualOverride: false,
      driverStatus: "Active"
    },
    system: {
      transport: "USB_SERIAL",
      wifi: false,
      connection: "connected",
      freeHeap: 221840,
      baud: 115200
    },
    ds18b20_temp: 36.85,
    dht_temp: 27.4,
    humidity: 55.0,
    fan: false,
    peltier: true,
    raw_red: 64100,
    raw_ir: 65200
  });

  parser.feedChunk(sampleJson + '\n');

  assert(packets.length === 1, 'Exactly one packet received');
  const pkt = packets[0];
  assert(pkt.deviceId === 'AVENZA_ESP32_01', 'Device ID matches');
  assert(pkt.firmware === '1.2.0', 'Firmware version matches');
  assert(pkt.system.transport === 'USB_SERIAL', 'Transport confirmed USB_SERIAL');
  assert(pkt.system.wifi === false, 'Wi-Fi confirmed false');
  assert(pkt.system.baud === 115200, 'Baud rate confirmed 115200');
  assert(pkt.sensors.ds18b20.temperature === 36.85, 'DS18B20 temperature matches 36.85°C');
  assert(pkt.sensors.dht11.humidity === 55.0, 'DHT11 humidity matches 55.0%');
  assert(pkt.sensors.max30102.heartRate === 138.5, 'MAX30102 heart rate is 138.5 BPM');
  assert(pkt.sensors.max30102.spo2 === 97.2, 'MAX30102 SpO2 is 97.2%');
  assert(pkt.actuators.peltierCommand === 'HEATING', 'Peltier command is HEATING');
  assert(pkt.actuators.fanCommand === false, 'Fan command is false (OFF)');
}

// TEST 2: Split / Fragmented Packet Across Chunks
console.log('\n[TEST 2] Split / Fragmented Packet Reassembly Across USB Serial Read Chunks');
{
  const packets = [];
  const parser = new StreamBufferParser(p => packets.push(p));

  const part1 = '{"type":"telemetry","deviceId":"AVENZA_ESP32_01","sensors":{"ds18b20":{"temperature":37.1';
  const part2 = ',"connected":true,"valid":true}},"actuators":{"fanCommand":true},"system":{"transport":"USB_SERIAL"}}\n';

  parser.feedChunk(part1);
  assert(packets.length === 0, 'No packet emitted while fragment is incomplete');

  parser.feedChunk(part2);
  assert(packets.length === 1, 'Packet emitted once newline is received');
  assert(packets[0].sensors.ds18b20.temperature === 37.1, 'Fragmented temperature correctly reassembled (37.1°C)');
  assert(packets[0].actuators.fanCommand === true, 'Fan command correctly reassembled (true)');
}

// TEST 3: Multiple Packets in a Single Chunk
console.log('\n[TEST 3] Multiple Line-Delimited Packets in Single Read Chunk');
{
  const packets = [];
  const parser = new StreamBufferParser(p => packets.push(p));

  const multiChunk = 
    '{"type":"telemetry","uptimeMs":1000,"sensors":{"ds18b20":{"temperature":36.2,"valid":true}}}\n' +
    '{"type":"telemetry","uptimeMs":2000,"sensors":{"ds18b20":{"temperature":36.3,"valid":true}}}\n' +
    '{"type":"telemetry","uptimeMs":3000,"sensors":{"ds18b20":{"temperature":36.4,"valid":true}}}\n';

  parser.feedChunk(multiChunk);
  assert(packets.length === 3, 'All 3 packets parsed from single buffer burst');
  assert(packets[0].sensors.ds18b20.temperature === 36.2, 'First packet temp is 36.2°C');
  assert(packets[2].sensors.ds18b20.temperature === 36.4, 'Third packet temp is 36.4°C');
}

// TEST 4: Malformed JSON Graceful Discard
console.log('\n[TEST 4] Malformed JSON Handling (Graceful Discard, No Crash)');
{
  const packets = [];
  const parser = new StreamBufferParser(p => packets.push(p));

  // Case A: Broken JSON inside braces
  const brokenSyntaxLine = '{"type":"telemetry","broken_syntax: invalid json}\n';
  // Case B: Truncated line without closing brace
  const truncatedLine = '{"type":"telemetry",incomplete line without closing brace\n';
  // Case C: Valid packet immediately following
  const validLine = '{"type":"telemetry","uptimeMs":5000,"sensors":{"ds18b20":{"temperature":36.9,"valid":true}}}\n';

  parser.feedChunk(brokenSyntaxLine);
  assert(packets.length === 0, 'Broken JSON inside braces was not emitted');
  assert(parser.errorsCount === 1, 'Error counter incremented for syntax error');

  parser.feedChunk(truncatedLine);
  assert(packets.length === 0, 'Truncated line without braces was discarded');

  parser.feedChunk(validLine);
  assert(packets.length === 1, 'Subsequent valid packet was processed normally');
  assert(packets[0].sensors.ds18b20.temperature === 36.9, 'Valid packet data intact');
}

// TEST 5: Non-JSON Diagnostic Lines Ignored
console.log('\n[TEST 5] ESP32 Diagnostic Lines ([BOOT], [HEARTBEAT], [I2C]) Safely Filtered');
{
  const packets = [];
  const parser = new StreamBufferParser(p => packets.push(p));

  const streamWithDiagnostics = 
    '[BOOT] Step 1: Initializing Relays & Safety States (OFF)...\n' +
    '[BOOT] Step 2: Initializing I2C bus (SDA=32, SCL=33)...\n' +
    '[I2C] Device detected at address 0x57 -> MAX30102 Optical PPG Sensor\n' +
    '{"type":"telemetry","uptimeMs":100,"sensors":{"ds18b20":{"temperature":36.5,"valid":true}}}\n' +
    '[HEARTBEAT] FreeHeap=224100 Temp=36.50C Fan=OFF Peltier=OFF Mode=AUTO Link=USB_SERIAL\n';

  parser.feedChunk(streamWithDiagnostics);
  assert(packets.length === 1, 'Diagnostic lines ignored, exactly 1 telemetry packet emitted');
  assert(packets[0].sensors.ds18b20.temperature === 36.5, 'Packet data parsed accurately');
}

// TEST 6: Real-Data Purity & Null Sensor Values
console.log('\n[TEST 6] Data Integrity: Null / Uncalibrated Sensors Never Fabricated in LIVE Mode');
{
  const packets = [];
  const parser = new StreamBufferParser(p => packets.push(p));

  // Simulating probe contact lost (no finger on MAX30102) and DS18B20 disconnected
  const noContactJson = JSON.stringify({
    type: "telemetry",
    deviceId: "AVENZA_ESP32_01",
    sensors: {
      ds18b20: { connected: false, valid: false, temperature: null },
      dht11: { connected: true, valid: true, temperature: 26.5, humidity: 48.0 },
      max30102: {
        connected: true, contact: false, valid: false,
        ir: 1200, red: 1100,
        heartRate: null, heartRateValid: false, heartRateQuality: 0.0,
        spo2: null, spo2Valid: false, spo2Quality: null,
        signalQuality: "POOR"
      }
    },
    actuators: {
      fanCommand: false,
      peltierCommand: "OFF",
      safetyCutoff: false
    }
  });

  parser.feedChunk(noContactJson + '\n');
  assert(packets.length === 1, 'Packet parsed');
  const pkt = packets[0];
  assert(pkt.sensors.max30102.contact === false, 'Optical contact is false');
  assert(pkt.sensors.max30102.heartRate === null, 'Heart rate is strictly null (not simulated)');
  assert(pkt.sensors.max30102.spo2 === null, 'SpO2 is strictly null (not simulated)');
  assert(pkt.sensors.ds18b20.valid === false, 'DS18B20 valid is false');
  assert(pkt.sensors.ds18b20.temperature === null, 'DS18B20 temperature is strictly null');
}

// TEST 7: Stale Telemetry Detection Logic
console.log('\n[TEST 7] Telemetry Freshness Watchdog (LIVE vs STALE @ 3500ms threshold)');
{
  function evaluateFreshness(isConnected, lastTelemetryAt, nowMs) {
    if (!isConnected) return 'DISCONNECTED';
    if (!lastTelemetryAt) return 'DISCONNECTED';
    const age = nowMs - lastTelemetryAt;
    if (age > 3500) return 'STALE';
    return 'LIVE';
  }

  const now = 100000;
  assert(evaluateFreshness(false, null, now) === 'DISCONNECTED', 'Not connected -> DISCONNECTED');
  assert(evaluateFreshness(true, now - 500, now) === 'LIVE', 'Packet 500ms ago -> LIVE');
  assert(evaluateFreshness(true, now - 1500, now) === 'LIVE', 'Packet 1500ms ago -> LIVE');
  assert(evaluateFreshness(true, now - 3499, now) === 'LIVE', 'Packet 3499ms ago -> LIVE');
  assert(evaluateFreshness(true, now - 3501, now) === 'STALE', 'Packet 3501ms ago -> STALE');
  assert(evaluateFreshness(true, now - 10000, now) === 'STALE', 'Packet 10000ms ago -> STALE');
}

// TEST 8: Command Acknowledgement (ACK) Parsing & Safety Rejection Handling
console.log('\n[TEST 8] Command ACK Parsing & Safety Interlock Handling');
{
  const acks = [];
  const packets = [];
  const parser = new StreamBufferParser(p => packets.push(p), a => acks.push(a));

  // Successful fan ACK
  parser.feedChunk(JSON.stringify({
    type: "command_ack",
    command: "SET_FAN 1",
    target: "fan",
    accepted: true,
    actualFan: true,
    reason: null,
    safetyInterlockActive: false
  }) + '\n');

  assert(acks.length === 1, 'Received command ACK');
  assert(acks[0].accepted === true, 'Fan command was accepted');
  assert(acks[0].actualFan === true, 'Actual fan confirmed true');

  // Interlock rejected peltier ACK
  parser.feedChunk(JSON.stringify({
    type: "command_ack",
    command: "SET_PELTIER 1",
    target: "peltier",
    accepted: false,
    actualPeltier: false,
    reason: "FAN_INTERLOCK_REQUIRED",
    safetyInterlockActive: true
  }) + '\n');

  assert(acks.length === 2, 'Received second ACK');
  assert(acks[1].accepted === false, 'Peltier heating was rejected without fan');
  assert(acks[1].reason === 'FAN_INTERLOCK_REQUIRED', 'Reason matches FAN_INTERLOCK_REQUIRED');
  assert(acks[1].safetyInterlockActive === true, 'Safety interlock confirmed active');
}

// TEST 9: MAX30102 Diagnostic Telemetry Fields (Signal Acquisition Progression)
console.log('\n[TEST 9] MAX30102 Diagnostic Fields & Pulse Acquisition Progression');
{
  const packets = [];
  const parser = new StreamBufferParser(p => packets.push(p));

  const diagnosticPacket = JSON.stringify({
    type: "telemetry",
    sensors: {
      max30102: {
        connected: true,
        contact: true,
        valid: false,
        ir: 42000,
        red: 38000,
        heartRate: null,
        heartRateValid: false,
        spo2: null,
        spo2Valid: false,
        invalidReason: "ACQUIRING_PULSE_LOCK",
        bpmCandidate: 124.0,
        spo2Candidate: 96.5,
        sampleCount: 150,
        qualityScore: 65.0
      }
    }
  });

  parser.feedChunk(diagnosticPacket + '\n');
  assert(packets.length === 1, 'Diagnostic packet parsed');
  const max = packets[0].sensors.max30102;
  assert(max.contact === true, 'Probe contact is true');
  assert(max.invalidReason === 'ACQUIRING_PULSE_LOCK', 'Invalid reason mapped');
  assert(max.bpmCandidate === 124.0, 'BPM candidate mapped (124.0)');
  assert(max.spo2Candidate === 96.5, 'SpO2 candidate mapped (96.5%)');
  assert(max.sampleCount === 150, 'Sample count mapped (150)');
  assert(max.qualityScore === 65.0, 'Quality score mapped (65.0)');
}

// TEST 10: Actuator State Separation
console.log('\n[TEST 10] Actuator Commanded vs Actual State Separation');
{
  const packets = [];
  const parser = new StreamBufferParser(p => packets.push(p));

  const actuatorPacket = JSON.stringify({
    type: "telemetry",
    mode: "MANUAL",
    actuators: {
      fanCommand: true,
      peltierCommand: "HEATING",
      peltierPwm: 180,
      safetyCutoff: false,
      driverStatus: "HEATING_NOMINAL",
      manualOverride: true
    }
  });

  parser.feedChunk(actuatorPacket + '\n');
  assert(packets.length === 1, 'Actuator telemetry packet parsed');
  const act = packets[0].actuators;
  assert(act.fanCommand === true, 'Fan commanded is true');
  assert(act.peltierCommand === 'HEATING', 'Peltier commanded is HEATING');
  assert(act.peltierPwm === 180, 'Peltier PWM is 180');
  assert(act.manualOverride === true, 'Manual override mode confirmed');
  assert(act.safetyCutoff === false, 'Safety cutoff is false');
}

console.log('\n============================================================');
console.log(`  PARSER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
}
