/**
 * AVENZA — Mock ESP32 HTTP REST API Server
 * 
 * Educational & Automated Testing Tool
 * Replicates the exact firmware REST API of the Avenza ESP32 prototype:
 * - GET  /api/health
 * - GET  /api/data
 * - GET  /api/history
 * - GET  /api/config
 * - POST /api/control
 * - Full CORS preflight support
 * 
 * Usage:
 *   node scripts/mock_esp32_server.js
 *   (or npm run mock:esp32)
 */

import http from 'http';

const PORT = process.env.MOCK_PORT || 8080;
const DEVICE_ID = 'AVENZA_ESP32_MOCK';
const FIRMWARE_VERSION = '1.2.0-mock';
const startTime = Date.now();

// State simulation
let mode = 'AUTO';
let fanState = false;
let peltierState = false;
let safetyCutoffActive = false;
let lastManualCommandTime = 0;
const MANUAL_TIMEOUT_MS = 60000;

// Sensor baseline simulation
let probeTemp = 29.2;
let airTemp = 28.4;
let humidity = 54.0;
let rawIR = 54200;
let rawRed = 51100;
let contactDetected = true;

// 30-sample circular history buffer
const HISTORY_CAPACITY = 30;
const history = [];

// Periodic simulation tick (every 1 second)
setInterval(() => {
  const now = Date.now();

  // Failsafe manual timeout
  if (mode === 'MANUAL' && (now - lastManualCommandTime > MANUAL_TIMEOUT_MS)) {
    mode = 'AUTO';
    console.log('[MOCK-ESP32] Manual timeout expired. Reverting to AUTO mode.');
  }

  // Autonomous temperature dynamics
  if (peltierState) {
    probeTemp += 0.15;
  } else if (fanState) {
    probeTemp -= 0.10;
  } else {
    // Ambient drift towards 29.0°C
    probeTemp += (29.0 - probeTemp) * 0.05 + (Math.random() - 0.5) * 0.04;
  }

  // Keep air temp slightly offset from probe
  airTemp = probeTemp - 0.8 + (Math.random() - 0.5) * 0.05;
  humidity = Math.max(30, Math.min(80, humidity + (Math.random() - 0.5) * 0.2));

  // Optical raw values
  if (contactDetected) {
    rawIR = 52000 + Math.floor(Math.sin(now / 500) * 3500) + Math.floor(Math.random() * 200);
    rawRed = 49000 + Math.floor(Math.sin(now / 500) * 3100) + Math.floor(Math.random() * 200);
  } else {
    rawIR = 1200 + Math.floor(Math.random() * 200);
    rawRed = 1100 + Math.floor(Math.random() * 200);
  }

  // Emergency safety cutoff at 38.0°C
  if (probeTemp >= 38.0) {
    safetyCutoffActive = true;
    peltierState = false;
    fanState = true;
  } else if (safetyCutoffActive && probeTemp < 36.0) {
    safetyCutoffActive = false;
  }

  // AUTO mode hysteresis
  if (mode === 'AUTO') {
    if (probeTemp >= 30.0) {
      fanState = true;
    } else if (probeTemp <= 29.5) {
      if (!peltierState) {
        fanState = false;
      }
    }
  }

  // Push to history
  history.push({
    uptime_sec: Math.floor((now - startTime) / 1000),
    probe_temp: parseFloat(probeTemp.toFixed(2)),
    air_temp: parseFloat(airTemp.toFixed(1)),
    humidity: parseFloat(humidity.toFixed(1)),
    fan: fanState,
    peltier: peltierState
  });

  if (history.length > HISTORY_CAPACITY) {
    history.shift();
  }
}, 1000);

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end();
    return;
  }

  // GET /api/health
  if (req.method === 'GET' && pathname === '/api/health') {
    const uptimeMs = Date.now() - startTime;
    return sendJson(res, 200, {
      status: 'ok',
      device_id: DEVICE_ID,
      device_name: 'Avenza Educational Mock Server',
      firmware_version: FIRMWARE_VERSION,
      uptime_ms: uptimeMs,
      uptime_sec: Math.floor(uptimeMs / 1000),
      wifi: {
        connected: true,
        ip: '127.0.0.1',
        ssid: 'MOCK_LAB_WIFI',
        rssi: -55
      },
      sensors: {
        dht11: { available: true },
        ds18b20: { available: true },
        max30102: { available: true },
        oled: { available: true }
      },
      actuators: {
        fan_relay: { gpio: 18, active_low: true },
        peltier_relay: { gpio: 25, active_low: true }
      },
      system: {
        free_heap: 218450,
        min_free_heap: 204320
      }
    });
  }

  // GET /api/data
  if (req.method === 'GET' && pathname === '/api/data') {
    const uptimeMs = Date.now() - startTime;
    return sendJson(res, 200, {
      device: DEVICE_ID,
      timestamp: Date.now(),
      uptime_ms: uptimeMs,
      uptime_sec: Math.floor(uptimeMs / 1000),
      mode: mode,
      sensors: {
        temperature_probe: parseFloat(probeTemp.toFixed(2)),
        air_temperature: parseFloat(airTemp.toFixed(1)),
        humidity: parseFloat(humidity.toFixed(1)),
        active_temperature: parseFloat(probeTemp.toFixed(2)),
        active_temperature_source: 'ds18b20',
        max30102: {
          available: true,
          contact: contactDetected,
          raw_ir: rawIR,
          raw_red: rawRed,
          experimental_note: 'Raw photoplethysmogram data only. Not calibrated vital signs.'
        }
      },
      actuators: {
        fan: fanState,
        peltier: peltierState,
        fan_reason: fanState ? (mode === 'AUTO' ? 'Temp >= 30.0C threshold' : 'Manual command') : 'Idle',
        peltier_reason: peltierState ? 'Manual command' : 'Idle',
        driver_status: peltierState ? 'PELTIER_ENERGIZED' : (fanState ? 'FAN_ACTIVE' : 'IDLE_OFF')
      },
      safety: {
        emergency_cutoff_active: safetyCutoffActive,
        heatsink_fan_interlock: true,
        emergency_cutoff_threshold_c: 38.0,
        failsafe_status: safetyCutoffActive ? 'CUTOFF_ENGAGED' : 'NOMINAL'
      }
    });
  }

  // GET /api/history
  if (req.method === 'GET' && pathname === '/api/history') {
    return sendJson(res, 200, {
      device: DEVICE_ID,
      count: history.length,
      capacity: HISTORY_CAPACITY,
      sample_interval_ms: 1000,
      samples: history
    });
  }

  // GET /api/config
  if (req.method === 'GET' && pathname === '/api/config') {
    return sendJson(res, 200, {
      device_name: 'Avenza Educational Mock Server',
      device_id: DEVICE_ID,
      firmware_version: FIRMWARE_VERSION,
      mode: mode,
      target_threshold_c: 30.0,
      hysteresis_c: 0.5,
      emergency_cutoff_c: 38.0,
      manual_timeout_sec: MANUAL_TIMEOUT_MS / 1000,
      primary_temp_sensor: 'ds18b20',
      fallback_temp_sensor: 'dht11',
      heatsink_fan_interlock: true,
      relay_active_low: true,
      pinout: {
        dht11_gpio: 5,
        ds18b20_gpio: 4,
        max30102_sda: 32,
        max30102_scl: 33,
        oled_sda: 32,
        oled_scl: 33,
        relay_fan_gpio: 18,
        relay_peltier_gpio: 25
      },
      disclaimer: 'Educational prototype only. Not for clinical care or diagnostic use.'
    });
  }

  // POST /api/control
  if (req.method === 'POST' && pathname === '/api/control') {
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(rawBody);

        // Mode validation
        if (payload.mode !== undefined) {
          const upper = String(payload.mode).toUpperCase();
          if (upper === 'AUTO' || upper === 'MANUAL') {
            mode = upper;
          } else {
            return sendJson(res, 400, {
              error: "Invalid mode. Allowed: 'AUTO' or 'MANUAL'",
              mode
            });
          }
        }

        // Actuator commands require MANUAL mode
        if (payload.fan !== undefined || payload.peltier !== undefined) {
          mode = 'MANUAL';
          lastManualCommandTime = Date.now();
        }

        // Fan control
        if (payload.fan !== undefined) {
          const targetFan = Boolean(payload.fan);
          // Heatsink fan interlock: cannot turn fan OFF if Peltier is ON
          if (!targetFan && peltierState) {
            return sendJson(res, 400, {
              error: 'Cannot turn OFF fan while Peltier is energized (Heatsink interlock)',
              mode
            });
          }
          fanState = targetFan;
        }

        // Peltier control
        if (payload.peltier !== undefined) {
          const targetPeltier = Boolean(payload.peltier);
          if (targetPeltier && safetyCutoffActive) {
            return sendJson(res, 400, {
              error: 'Peltier command rejected by thermal safety cutoff',
              mode
            });
          }
          // Enforce heatsink fan when Peltier is ON
          if (targetPeltier) {
            fanState = true;
          }
          peltierState = targetPeltier;
        }

        return sendJson(res, 200, {
          success: true,
          mode,
          fan: fanState,
          peltier: peltierState,
          driver_status: peltierState ? 'PELTIER_ENERGIZED' : (fanState ? 'FAN_ACTIVE' : 'IDLE_OFF')
        });
      } catch (err) {
        return sendJson(res, 400, {
          error: 'Malformed JSON payload',
          details: err.message
        });
      }
    });
    return;
  }

  // 404
  return sendJson(res, 404, {
    error: 'Endpoint not found',
    requested: pathname
  });
});

server.listen(PORT, () => {
  console.log(`[MOCK-ESP32] Avenza Mock ESP32 server running at http://localhost:${PORT}`);
  console.log(`[MOCK-ESP32] Endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log(`   - GET  http://localhost:${PORT}/api/data`);
  console.log(`   - GET  http://localhost:${PORT}/api/history`);
  console.log(`   - GET  http://localhost:${PORT}/api/config`);
  console.log(`   - POST http://localhost:${PORT}/api/control`);
});
