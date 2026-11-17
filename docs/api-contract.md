# AVENZA ESP32 REST API Contract

## Specification Version
- **Firmware API Version**: `v1.2.0`
- **Default Port**: `80` (HTTP)
- **Protocol**: HTTP/1.1 REST with JSON formatting
- **CORS Support**: All endpoints support `OPTIONS` preflight and emit `Access-Control-Allow-Origin: *`.

---

## Common Headers
All response payloads include standard CORS and cache-invalidation headers:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Cache-Control: no-cache, no-store, must-revalidate
Content-Type: application/json
```

---

## 1. System Health & Diagnostics
### `GET /api/health`
Returns firmware status, hardware sub-system availability, Wi-Fi connectivity, and memory metrics.

#### Response (200 OK)
```json
{
  "status": "ok",
  "device_id": "AVENZA_ESP32_01",
  "device_name": "Avenza Educational Prototype",
  "firmware_version": "1.2.0",
  "uptime_ms": 128450,
  "uptime_sec": 128,
  "wifi": {
    "connected": true,
    "ip": "192.168.1.150",
    "ssid": "RESEARCH_LAB_WIFI",
    "rssi": -62
  },
  "sensors": {
    "dht11": { "available": true },
    "ds18b20": { "available": true },
    "max30102": { "available": true }
  },
  "actuators": {
    "fan_relay": { "gpio": 18, "active_low": true },
    "peltier_relay": { "gpio": 25, "active_low": true }
  },
  "system": {
    "free_heap": 215400,
    "min_free_heap": 204120
  }
}
```

---

## 2. Live Sensor Telemetry & Actuator States
### `GET /api/data`
Returns latest real-time sensor readings, active temperature source selection, actuator states, and safety status.

#### Response (200 OK)
```json
{
  "device": "AVENZA_ESP32_01",
  "timestamp": 128450,
  "uptime_ms": 128450,
  "uptime_sec": 128,
  "mode": "AUTO",
  "sensors": {
    "temperature_probe": 29.35,
    "air_temperature": 28.2,
    "humidity": 54.0,
    "active_temperature": 29.35,
    "active_temperature_source": "ds18b20",
    "max30102": {
      "available": true,
      "contact": true,
      "raw_ir": 54200,
      "raw_red": 51100,
      "experimental_note": "Raw photoplethysmogram data only. Not calibrated vital signs."
    }
  },
  "actuators": {
    "fan": false,
    "peltier": false,
    "fan_reason": "Temp <= 29.5°C threshold",
    "peltier_reason": "Standby",
    "driver_status": "IDLE_OFF"
  },
  "safety": {
    "emergency_cutoff_active": false,
    "heatsink_fan_interlock": true,
    "emergency_cutoff_threshold_c": 38.0,
    "failsafe_status": "NOMINAL"
  }
}
```

> **Note on Nulls**: When a sensor is physically disconnected, in an error state, or initializing, its value returns as `null` rather than a fabricated number (e.g. `"temperature_probe": null`).

---

## 3. Telemetry Sample History
### `GET /api/history`
Returns a bounded chronological history of sensor readings from the ESP32 in-memory ring buffer (default capacity: 30 samples, 1 sample every 2000 ms).

#### Response (200 OK)
```json
{
  "device": "AVENZA_ESP32_01",
  "count": 3,
  "capacity": 30,
  "sample_interval_ms": 2000,
  "samples": [
    {
      "uptime_sec": 124,
      "probe_temp": 29.20,
      "air_temp": 28.1,
      "humidity": 54.0,
      "fan": false,
      "peltier": false
    },
    {
      "uptime_sec": 126,
      "probe_temp": 29.28,
      "air_temp": 28.2,
      "humidity": 54.0,
      "fan": false,
      "peltier": false
    },
    {
      "uptime_sec": 128,
      "probe_temp": 29.35,
      "air_temp": 28.2,
      "humidity": 54.0,
      "fan": false,
      "peltier": false
    }
  ]
}
```

---

## 4. Hardware Configuration & Pinout
### `GET /api/config`
Returns non-secret hardware configuration, pin mapping, and threshold settings.

#### Response (200 OK)
```json
{
  "device_name": "Avenza Educational Prototype",
  "device_id": "AVENZA_ESP32_01",
  "firmware_version": "1.2.0",
  "mode": "AUTO",
  "target_threshold_c": 30.0,
  "hysteresis_c": 0.5,
  "emergency_cutoff_c": 38.0,
  "manual_timeout_sec": 60,
  "primary_temp_sensor": "ds18b20",
  "fallback_temp_sensor": "dht11",
  "heatsink_fan_interlock": true,
  "relay_active_low": true,
  "pinout": {
    "dht11_gpio": 5,
    "ds18b20_gpio": 4,
    "max30102_sda": 32,
    "max30102_scl": 33,
    "relay_fan_gpio": 18,
    "relay_peltier_gpio": 25
  },
  "disclaimer": "Educational prototype only. Not for clinical care or diagnostic use."
}
```

---

## 5. Actuator & Mode Command Control
### `POST /api/control`
Dispatches manual commands or returns the system to autonomous hysteresis mode.

#### Request Body (JSON)
```json
{
  "mode": "MANUAL",
  "fan": true,
  "peltier": false
}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `mode` | `string` | Optional. Allowed: `"AUTO"` or `"MANUAL"`. |
| `fan` | `boolean` | Optional. `true` = energize relay, `false` = de-energize. |
| `peltier` | `boolean` | Optional. `true` = energize relay, `false` = de-energize. |

#### Successful Response (200 OK)
```json
{
  "success": true,
  "mode": "MANUAL",
  "fan": true,
  "peltier": false,
  "driver_status": "FAN_ACTIVE"
}
```

#### Error Response (400 Bad Request)
Returned when a command is rejected by input validation or hardware safety interlocks:
```json
{
  "error": "Cannot turn OFF fan while Peltier is energized (Heatsink interlock)",
  "mode": "MANUAL"
}
```
Common Error Messages:
- `"Cannot turn OFF fan while Peltier is energized (Heatsink interlock)"`
- `"Peltier command rejected by thermal safety cutoff"`
- `"Invalid mode. Allowed: 'AUTO' or 'MANUAL'"`
- `"Missing JSON request body"`
