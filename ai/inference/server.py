"""
AVENZA Master AI Inference & Hardware Streaming Server
FastAPI REST and WebSocket server hosting the trained multimodal neural network,
hardware serial bridge (ESP32), camera vision kinematics, and dashboard telemetry stream.
"""

import os
import sys
import json
import time
import asyncio
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .inference_engine import RealtimeApneaInferenceEngine
from ..bridge.hardware_bridge import esp32_bridge
from ..bridge.camera_bridge import camera_bridge

# Verify trained model weights exist before startup
MODEL_PT_PATH = "data/processed/models/best_fusion_model.pt"
MODEL_ONNX_PATH = "data/processed/models/avenza_fusion_model.onnx"

if not os.path.exists(MODEL_PT_PATH) and not os.path.exists(MODEL_ONNX_PATH):
    print("================================================================================")
    print("CRITICAL ERROR: Existing trained AVENZA model weights were not found.")
    print(f"Missing expected model weights: {MODEL_PT_PATH}")
    print("================================================================================")
    sys.exit(1)

# Global Real-Time Inference Engine
engine = RealtimeApneaInferenceEngine(model_path=MODEL_PT_PATH, use_onnx_if_available=True)

# Attach engine to hardware and camera bridges
esp32_bridge.set_inference_engine(engine)
camera_bridge.set_inference_engine(engine)

# Active dashboard WebSocket connections
active_ws_clients: List[WebSocket] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Try connecting to ESP32 and auto-start camera capture
    print("\n[AVENZA SERVER] Starting AI Inference Engine & Hardware Subsystems...")
    esp32_bridge.connect()
    camera_bridge.start_capture()

    # Background broadcast task
    broadcast_task = asyncio.create_task(periodic_dashboard_broadcast())

    yield

    # Shutdown
    print("[AVENZA SERVER] Shutting down background bridges...")
    broadcast_task.cancel()
    esp32_bridge.disconnect()
    camera_bridge.stop_capture()


app = FastAPI(
    title="AVENZA Multimodal AI & Hardware Telemetry Engine",
    description="Real-Time Multimodal Neonatal Apnea Detection API with Physical ESP32 Hardware Integration",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def periodic_dashboard_broadcast():
    """Broadcasts unified telemetry and model inference at 5 Hz to all connected dashboard clients."""
    while True:
        try:
            if active_ws_clients:
                # 1. Execute inference step
                inference_result = engine.process_inference_step()

                # 2. Grab latest hardware telemetry
                hw_status = esp32_bridge.get_status()
                cam_status = camera_bridge.get_status()

                # 3. Assemble unified payload
                combined_payload = {
                    "type": "unified_telemetry",
                    "timestamp": int(time.time() * 1000),
                    "hardware": hw_status,
                    "camera": cam_status,
                    "inference": inference_result,
                    "disclaimer": "AI-ASSISTED APNEA EVENT DETECTION — PROTOTYPE (MODEL PROBABILITY — NOT A CLINICAL DIAGNOSIS)"
                }

                # Broadcast to all connected clients
                disconnected = []
                for ws in active_ws_clients:
                    try:
                        await ws.send_json(combined_payload)
                    except Exception:
                        disconnected.append(ws)

                for dead_ws in disconnected:
                    if dead_ws in active_ws_clients:
                        active_ws_clients.remove(dead_ws)

            await asyncio.sleep(0.2)  # 5 Hz broadcast rate
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[Broadcast Error] {e}")
            await asyncio.sleep(0.5)


# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

class FanCommandPayload(BaseModel):
    action: Optional[str] = Field(default=None, description="'ON' or 'OFF'")
    value: Optional[bool] = Field(default=None, description="True=ON, False=OFF")


class PeltierCommandPayload(BaseModel):
    mode: str = Field(default="OFF", description="'HEATING', 'COOLING', or 'OFF'")
    pwm: int = Field(default=180, description="PWM level 0-255")


class StreamSamplePayload(BaseModel):
    raw_red: float = Field(..., description="MAX30102 Raw Red Photoplethysmography count")
    raw_ir: float = Field(..., description="MAX30102 Raw Infrared Photoplethysmography count")
    heart_rate: float = Field(..., description="Calculated Heart Rate in BPM")
    spo2: float = Field(..., description="Calculated SpO2 in percentage")
    displacement: float = Field(default=0.015, description="Video chest ROI displacement")
    flow_y: float = Field(default=0.005, description="Video vertical optical flow velocity")
    pose_y: float = Field(default=0.45, description="Infant chest keypoint Y coordinate")
    energy: float = Field(default=0.001, description="Video movement kinetic energy")


@app.get("/")
def read_root():
    return {
        "service": "AVENZA Multimodal AI & Hardware Telemetry Engine",
        "status": "ONLINE",
        "device": engine.device,
        "engine_mode": "ONNX_RUNTIME" if engine.use_onnx else f"PYTORCH_{engine.device.upper()}",
        "esp32_connected": esp32_bridge.is_connected,
        "esp32_port": esp32_bridge.port,
        "camera_active": camera_bridge.is_capturing,
        "disclaimer": "AI-ASSISTED APNEA EVENT DETECTION — PROTOTYPE (MODEL PROBABILITY — NOT A CLINICAL DIAGNOSIS)"
    }


@app.get("/api/health")
def get_health():
    inference_step = engine.process_inference_step()
    return {
        "status": "HEALTHY",
        "buffer_warmed_up": engine.is_warmed_up(),
        "ppg_samples_in_buffer": len(engine.ppg_ir_buf),
        "video_samples_in_buffer": len(engine.vid_disp_buf),
        "current_state": engine.state_machine.current_state.value,
        "esp32": esp32_bridge.get_status(),
        "camera": camera_bridge.get_status(),
        "latest_inference": inference_step
    }


@app.get("/api/model-info")
def get_model_info():
    return {
        "architecture": "Multimodal Late-Fusion 1D CNN + Bi-GRU with Dynamic SQI Gating",
        "model_files": {
            "pytorch_weights": MODEL_PT_PATH,
            "onnx_model": MODEL_ONNX_PATH,
            "active_mode": "ONNX_RUNTIME" if engine.use_onnx else "PYTORCH"
        },
        "input_sampling": {
            "ppg_fs": 50,
            "video_fs": 15,
            "window_duration_sec": 10,
            "stride_sec": 1
        },
        "modalities": [
            {"name": "MAX30102 PPG & Vitals", "channels": ["raw_red", "raw_ir", "heart_rate", "spo2"]},
            {"name": "Webcam Chest Kinematics", "channels": ["displacement", "optical_flow", "pose_chest_y", "movement_energy"]}
        ],
        "state_machine_states": ["NORMAL", "SUSPECTED", "APNEA_EVENT", "RECOVERY", "SENSOR_ERROR", "MOTION_ARTIFACT", "VIDEO_UNAVAILABLE"],
        "prototype_disclaimer": "RESEARCH & EDUCATIONAL PROTOTYPE ONLY — NOT FOR CLINICAL DIAGNOSTIC USE"
    }


@app.get("/api/telemetry/latest")
def get_latest_telemetry():
    """Returns a unified snapshot of hardware sensors, camera kinematics, and AI model verdict."""
    inference_result = engine.process_inference_step()
    return {
        "timestamp": int(time.time() * 1000),
        "hardware": esp32_bridge.get_status(),
        "camera": camera_bridge.get_status(),
        "inference": inference_result
    }


@app.post("/api/reset")
def reset_engine():
    engine.reset_buffers()
    return {"status": "BUFFERS_AND_STATE_RESET"}


@app.post("/api/push-sample")
def push_single_sample(payload: StreamSamplePayload):
    engine.push_ppg_sample(
        raw_red=payload.raw_red,
        raw_ir=payload.raw_ir,
        hr=payload.heart_rate,
        spo2=payload.spo2
    )
    engine.push_video_sample(
        displacement=payload.displacement,
        flow_y=payload.flow_y,
        pose_y=payload.pose_y,
        energy=payload.energy
    )
    return engine.process_inference_step()


# --- Actuator Control Endpoints ---

@app.post("/api/actuators/fan")
def control_fan(payload: FanCommandPayload):
    """Sends relay fan ON/OFF command to ESP32."""
    turn_on = False
    if payload.action is not None:
        turn_on = (payload.action.upper() == "ON")
    elif payload.value is not None:
        turn_on = payload.value

    ok = esp32_bridge.send_fan(turn_on)
    return {
        "success": ok,
        "fan_command": "ON" if turn_on else "OFF",
        "esp32_connected": esp32_bridge.is_connected
    }


@app.post("/api/actuators/peltier")
def control_peltier(payload: PeltierCommandPayload):
    """Sends Peltier heating/cooling/off command to ESP32."""
    ok = esp32_bridge.send_peltier(mode=payload.mode, pwm=payload.pwm)
    return {
        "success": ok,
        "peltier_command": payload.mode.upper(),
        "pwm": payload.pwm,
        "esp32_connected": esp32_bridge.is_connected
    }


@app.post("/api/actuators/auto")
def resume_auto_control():
    """Resumes onboard autonomous hysteresis thermal control."""
    ok = esp32_bridge.send_auto()
    return {
        "success": ok,
        "mode": "AUTONOMOUS_HYSTERESIS",
        "esp32_connected": esp32_bridge.is_connected
    }


# --- Hardware Bridge Control Endpoints ---

@app.get("/api/bridge/ports")
def list_serial_ports():
    return {"ports": esp32_bridge.list_available_ports()}


@app.post("/api/bridge/connect")
def connect_bridge(port: Optional[str] = Query(None)):
    ok = esp32_bridge.connect(port)
    return {
        "success": ok,
        "port": esp32_bridge.port,
        "is_connected": esp32_bridge.is_connected,
        "error": esp32_bridge.last_error
    }


@app.post("/api/bridge/disconnect")
def disconnect_bridge():
    esp32_bridge.disconnect()
    return {"status": "DISCONNECTED"}


# --- Camera Bridge Control Endpoints ---

@app.post("/api/camera/start")
def start_camera(index: int = Query(0)):
    ok = camera_bridge.start_capture(camera_index=index)
    return {
        "success": ok,
        "camera_index": index,
        "is_capturing": camera_bridge.is_capturing,
        "error": camera_bridge.last_error
    }


@app.post("/api/camera/stop")
def stop_camera():
    camera_bridge.stop_capture()
    return {"status": "STOPPED"}


# ==============================================================================
# WEBSOCKET STREAMING ENDPOINTS
# ==============================================================================

@app.websocket("/ws/dashboard")
async def websocket_dashboard_endpoint(websocket: WebSocket):
    """Real-time 5 Hz broadcast feed directly feeding the AVENZA React dashboard."""
    await websocket.accept()
    active_ws_clients.append(websocket)
    print(f"[WebSocket] Dashboard client connected. Active clients: {len(active_ws_clients)}")
    try:
        while True:
            # Keep connection alive and accept incoming dashboard commands
            data = await websocket.receive_text()
            msg = json.loads(data)
            action = msg.get("action")
            if action == "fan":
                esp32_bridge.send_fan(bool(msg.get("value", False)))
            elif action == "peltier":
                esp32_bridge.send_peltier(str(msg.get("mode", "OFF")), int(msg.get("pwm", 180)))
            elif action == "auto":
                esp32_bridge.send_auto()
            elif action == "reset":
                engine.reset_buffers()
    except WebSocketDisconnect:
        if websocket in active_ws_clients:
            active_ws_clients.remove(websocket)
        print(f"[WebSocket] Dashboard client disconnected. Active clients: {len(active_ws_clients)}")
    except Exception as e:
        if websocket in active_ws_clients:
            active_ws_clients.remove(websocket)
        print(f"[WebSocket Error] {e}")


@app.websocket("/ws/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    """Bidirectional raw sample stream endpoint."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            action = msg.get("action", "sample")

            if action == "reset":
                engine.reset_buffers()
                await websocket.send_json({"status": "RESET_DONE"})
            elif action == "sample":
                engine.push_ppg_sample(
                    raw_red=float(msg.get("raw_red", 32000)),
                    raw_ir=float(msg.get("raw_ir", 35000)),
                    hr=float(msg.get("heart_rate", 140)),
                    spo2=float(msg.get("spo2", 97))
                )
                engine.push_video_sample(
                    displacement=float(msg.get("displacement", 0.015)),
                    flow_y=float(msg.get("flow_y", 0.005)),
                    pose_y=float(msg.get("pose_y", 0.45)),
                    energy=float(msg.get("energy", 0.001))
                )
                result = engine.process_inference_step()
                await websocket.send_json(result)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WebSocket Stream Error] {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.inference.server:app", host="0.0.0.0", port=8000, reload=False)
