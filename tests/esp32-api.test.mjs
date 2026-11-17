/**
 * Automated Verification Test Suite for Avenza ESP32 REST API Contract
 * 
 * Verifies:
 * 1. Health endpoint schema and availability
 * 2. Telemetry data endpoint and uncalibrated sensor notes
 * 3. History bounded ring buffer
 * 4. Configuration and pinout map
 * 5. Actuator control commands and interlock enforcement
 * 6. Error handling for malformed or illegal commands
 * 7. CORS preflight headers
 */

import http from 'http';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:8080';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json',
      }
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          if (data) parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(body);
    req.end();
  });
}

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

async function runTests() {
  console.log(`\n============================================================`);
  console.log(`  AVENZA ESP32 REST API VERIFICATION SUITE`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`============================================================\n`);

  try {
    // 1. Health Endpoint
    console.log('[TEST 1] GET /api/health');
    const healthRes = await makeRequest('GET', '/api/health');
    assert(healthRes.statusCode === 200, 'HTTP status is 200');
    assert(healthRes.data.status === 'ok', 'Status is "ok"');
    assert(typeof healthRes.data.uptime_ms === 'number', 'Uptime is present as number');
    assert(healthRes.data.wifi && healthRes.data.wifi.ip !== undefined, 'WiFi IP object is present');
    assert(healthRes.data.sensors && healthRes.data.sensors.dht11 !== undefined, 'DHT11 sensor availability is reported');
    assert(healthRes.data.sensors.ds18b20 !== undefined, 'DS18B20 sensor availability is reported');
    assert(healthRes.data.sensors.max30102 !== undefined, 'MAX30102 sensor availability is reported');

    // 2. Data Endpoint
    console.log('\n[TEST 2] GET /api/data');
    const dataRes = await makeRequest('GET', '/api/data');
    assert(dataRes.statusCode === 200, 'HTTP status is 200');
    assert(dataRes.data.mode === 'AUTO' || dataRes.data.mode === 'MANUAL', 'Valid mode reported');
    assert(dataRes.data.sensors && dataRes.data.sensors.active_temperature_source !== undefined, 'Active temperature source identified');
    assert(dataRes.data.sensors.max30102 && typeof dataRes.data.sensors.max30102.raw_ir === 'number', 'Raw IR PPG is exposed as number');
    assert(typeof dataRes.data.sensors.max30102.raw_red === 'number', 'Raw Red PPG is exposed as number');
    assert(dataRes.data.actuators && typeof dataRes.data.actuators.fan === 'boolean', 'Fan boolean state is exposed');
    assert(typeof dataRes.data.actuators.peltier === 'boolean', 'Peltier boolean state is exposed');

    // 3. History Endpoint
    console.log('\n[TEST 3] GET /api/history');
    const histRes = await makeRequest('GET', '/api/history');
    assert(histRes.statusCode === 200, 'HTTP status is 200');
    assert(Array.isArray(histRes.data.samples), 'Samples returned as array');
    assert(typeof histRes.data.count === 'number', 'Sample count is numeric');
    assert(histRes.data.capacity <= 60, 'Sample capacity is bounded (<= 60)');

    // 4. Config Endpoint
    console.log('\n[TEST 4] GET /api/config');
    const confRes = await makeRequest('GET', '/api/config');
    assert(confRes.statusCode === 200, 'HTTP status is 200');
    assert(confRes.data.target_threshold_c === 30.0, 'Default prototype threshold is 30.0°C');
    assert(confRes.data.pinout && confRes.data.pinout.dht11_gpio === 5, 'DHT11 pin is GPIO 5');
    assert(confRes.data.pinout.ds18b20_gpio === 4, 'DS18B20 pin is GPIO 4');
    assert(confRes.data.pinout.relay_fan_gpio === 18, 'Fan relay pin is GPIO 18');
    assert(confRes.data.pinout.relay_peltier_gpio === 25, 'Peltier relay pin is GPIO 25');

    // 5. Control: Manual Fan Command
    console.log('\n[TEST 5] POST /api/control (Fan Command)');
    const fanCmdRes = await makeRequest('POST', '/api/control', JSON.stringify({ mode: 'MANUAL', fan: true }));
    assert(fanCmdRes.statusCode === 200, 'HTTP status is 200');
    assert(fanCmdRes.data.success === true, 'Success flag is true');
    assert(fanCmdRes.data.fan === true, 'Fan state is now true');
    assert(fanCmdRes.data.mode === 'MANUAL', 'Mode transitioned to MANUAL');

    // 6. Control: Heatsink Interlock Enforcement
    console.log('\n[TEST 6] POST /api/control (Heatsink Interlock Test)');
    // Energize Peltier
    const pelOnRes = await makeRequest('POST', '/api/control', JSON.stringify({ peltier: true }));
    assert(pelOnRes.statusCode === 200, 'Peltier turned ON');
    assert(pelOnRes.data.peltier === true, 'Peltier state is true');
    assert(pelOnRes.data.fan === true, 'Heatsink interlock forced fan to stay ON');

    // Try turning fan OFF while Peltier is energized -> MUST fail with 400!
    const fanOffBlocked = await makeRequest('POST', '/api/control', JSON.stringify({ fan: false }));
    assert(fanOffBlocked.statusCode === 400, 'Turning fan OFF while Peltier is energized rejected with 400');
    assert(fanOffBlocked.data.error.includes('Heatsink interlock'), 'Clear error explanation returned');

    // Turn Peltier OFF, then fan OFF
    await makeRequest('POST', '/api/control', JSON.stringify({ peltier: false }));
    const fanOffAllowed = await makeRequest('POST', '/api/control', JSON.stringify({ fan: false }));
    assert(fanOffAllowed.statusCode === 200, 'Fan turn OFF allowed when Peltier is OFF');
    assert(fanOffAllowed.data.fan === false, 'Fan state is false');

    // 7. Control: Return to AUTO Mode
    console.log('\n[TEST 7] POST /api/control (Return to AUTO Mode)');
    const autoRes = await makeRequest('POST', '/api/control', JSON.stringify({ mode: 'AUTO' }));
    assert(autoRes.statusCode === 200, 'HTTP status is 200');
    assert(autoRes.data.mode === 'AUTO', 'Mode is AUTO');

    // 8. Error Handling: Illegal mode
    console.log('\n[TEST 8] POST /api/control (Invalid Mode)');
    const badModeRes = await makeRequest('POST', '/api/control', JSON.stringify({ mode: 'TURBO_MEGA_MODE' }));
    assert(badModeRes.statusCode === 400, 'Invalid mode rejected with HTTP 400');
    assert(badModeRes.data.error.includes('Invalid mode'), 'Clear error message returned');

    // 9. CORS Preflight
    console.log('\n[TEST 9] OPTIONS /api/data (CORS Preflight)');
    const corsRes = await makeRequest('OPTIONS', '/api/data');
    assert(corsRes.statusCode === 204, 'Preflight returns 204');
    assert(corsRes.headers['access-control-allow-origin'] === '*', 'Access-Control-Allow-Origin is *');

    console.log(`\n============================================================`);
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`============================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\nTest runner error:', err.message);
    process.exit(1);
  }
}

runTests();
