"""
Apnea Temporal Event State Machine and Hysteresis Engine
Maintains continuous state tracking across streaming temporal windows with robust artifact rejection.
"""

from enum import Enum
from typing import Dict, Any, Optional


class MonitorState(str, Enum):
    NORMAL = "NORMAL"
    SUSPECTED = "SUSPECTED"
    APNEA_EVENT = "APNEA_EVENT"
    RECOVERY = "RECOVERY"
    SENSOR_ERROR = "SENSOR_ERROR"
    MOTION_ARTIFACT = "MOTION_ARTIFACT"
    VIDEO_UNAVAILABLE = "VIDEO_UNAVAILABLE"


class ApneaTemporalStateMachine:
    """
    Temporal State Machine implementing hysteresis thresholds, consecutive confirmation windows,
    and signal quality interlocks.
    """

    def __init__(
        self,
        suspected_threshold: float = 0.45,
        event_threshold: float = 0.65,
        recovery_threshold: float = 0.30,
        confirmation_windows: int = 3,
        recovery_windows: int = 3
    ):
        self.suspected_threshold = suspected_threshold
        self.event_threshold = event_threshold
        self.recovery_threshold = recovery_threshold
        self.confirmation_windows = confirmation_windows
        self.recovery_windows = recovery_windows

        # State tracking
        self.current_state = MonitorState.NORMAL
        self.consecutive_elevated = 0
        self.consecutive_normal = 0
        self.event_duration_sec = 0.0
        self.active_event_type = "none"

    def reset(self):
        self.current_state = MonitorState.NORMAL
        self.consecutive_elevated = 0
        self.consecutive_normal = 0
        self.event_duration_sec = 0.0
        self.active_event_type = "none"

    def update(
        self,
        apnea_score: float,
        ppg_sqi: float,
        video_sqi: float,
        perfusion_index: float,
        pred_type: str = "central_apnea",
        step_duration_sec: float = 1.0
    ) -> Dict[str, Any]:
        """
        Processes a new 1-second step prediction and returns the updated state dictionary.
        """
        # 1. Check Signal Quality Interlocks First
        if ppg_sqi < 0.20 or perfusion_index <= 0.0:
            self.current_state = MonitorState.SENSOR_ERROR
            self.consecutive_elevated = 0
            self.consecutive_normal = 0
            return self._build_verdict(
                score=0.0,
                reason="MAX30102 PPG sensor detached, zero perfusion, or invalid signal",
                is_alert=False
            )

        if ppg_sqi < 0.40 and video_sqi < 0.40:
            self.current_state = MonitorState.MOTION_ARTIFACT
            self.consecutive_elevated = 0
            self.consecutive_normal = 0
            return self._build_verdict(
                score=apnea_score,
                reason="High-energy infant motion artifact detected across both modalities",
                is_alert=False
            )

        # 2. Process Apnea Evidence Hysteresis
        if apnea_score >= self.event_threshold:
            self.consecutive_elevated += 1
            self.consecutive_normal = 0
        elif apnea_score >= self.suspected_threshold:
            self.consecutive_normal = 0
        else:
            self.consecutive_normal += 1
            self.consecutive_elevated = max(0, self.consecutive_elevated - 1)

        # 3. State Transitions
        if self.current_state in [MonitorState.NORMAL, MonitorState.RECOVERY, MonitorState.SENSOR_ERROR, MonitorState.MOTION_ARTIFACT]:
            if apnea_score >= self.event_threshold:
                if self.consecutive_elevated >= self.confirmation_windows:
                    self.current_state = MonitorState.APNEA_EVENT
                    self.active_event_type = pred_type
                    self.event_duration_sec = self.consecutive_elevated * step_duration_sec
                else:
                    self.current_state = MonitorState.SUSPECTED
            elif apnea_score >= self.suspected_threshold:
                self.current_state = MonitorState.SUSPECTED
            else:
                self.current_state = MonitorState.NORMAL

        elif self.current_state == MonitorState.SUSPECTED:
            if self.consecutive_elevated >= self.confirmation_windows:
                self.current_state = MonitorState.APNEA_EVENT
                self.active_event_type = pred_type
                self.event_duration_sec = self.consecutive_elevated * step_duration_sec
            elif apnea_score < self.suspected_threshold and self.consecutive_normal >= 2:
                self.current_state = MonitorState.NORMAL

        elif self.current_state == MonitorState.APNEA_EVENT:
            self.event_duration_sec += step_duration_sec
            if apnea_score <= self.recovery_threshold:
                if self.consecutive_normal >= self.recovery_windows:
                    self.current_state = MonitorState.RECOVERY
            else:
                self.consecutive_normal = 0

        elif self.current_state == MonitorState.RECOVERY:
            if self.consecutive_normal >= self.recovery_windows + 2:
                self.current_state = MonitorState.NORMAL
                self.event_duration_sec = 0.0
                self.active_event_type = "none"
            elif apnea_score >= self.event_threshold:
                self.current_state = MonitorState.APNEA_EVENT

        is_alert = (self.current_state == MonitorState.APNEA_EVENT)

        return self._build_verdict(
            score=apnea_score,
            reason=f"State: {self.current_state.value} | Event: {self.active_event_type}",
            is_alert=is_alert
        )

    def _build_verdict(self, score: float, reason: str, is_alert: bool) -> Dict[str, Any]:
        return {
            "state": self.current_state.value,
            "apnea_score": float(score),
            "is_alert": is_alert,
            "event_type": self.active_event_type,
            "event_duration_sec": float(self.event_duration_sec),
            "consecutive_elevated": self.consecutive_elevated,
            "consecutive_normal": self.consecutive_normal,
            "reason": reason
        }
