from collections import deque
import json
import logging
import os
import threading
import time
from urllib.parse import urlencode

from dotenv import load_dotenv
import pyaudio
import websocket

from Agent_2 import run_agent
from event_bridge import broadcast_event
from GateKeeper import check_gate

load_dotenv()

logger = logging.getLogger("Voice_Engine")

# Sliding memory: retains the last 3 turns for co-reference resolution
context_window = deque(maxlen=3)

ASSEMBLY_API_KEY = os.environ.get("ASSEMBLYAI_API_KEY", "")

CONNECTION_PARAMS = {
    "speech_model": "universal-3-5-pro",
    "sample_rate": 16000,
    "encoding": "pcm_s16le",
}

API_ENDPOINT = "wss://streaming.assemblyai.com/v3/ws?" + urlencode(
    CONNECTION_PARAMS
)

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs.play import play
    eleven_api_key = os.getenv("ELEVENLABS_API_KEY")
    eleven_client = ElevenLabs(api_key=eleven_api_key) if eleven_api_key else None
except Exception:
    ElevenLabs = None
    play = None
    eleven_client = None

is_speaking = False


def speak(text: str):
    """Convert text to speech and play via ElevenLabs."""
    global is_speaking
    if not eleven_client or not play:
        print("[Voice Engine] ElevenLabs client not configured, skipping audio playback.")
        return

    try:
        is_speaking = True
        broadcast_event("agent_state", {"state": "Speaking"})
        audio = eleven_client.text_to_speech.convert(
            text=text,
            voice_id="XrExE9yKIg1WjnnlVkGX",
            model_id="eleven_v3",
            output_format="mp3_44100_128",
        )
        play(audio)
    except Exception as e:
        print(f"[Voice Engine] Error during speak: {e}")
    finally:
        time.sleep(0.6)
        is_speaking = False
        broadcast_event("agent_state", {"state": "Idle"})


class VoiceEngineWorker:

  def __init__(self):
    self.stop_event = threading.Event()
    self.ws = None
    self.worker_thread = None
    self.is_running = False
    self.last_final_transcript = ""
    self.last_final_time = 0.0
    self.mode = "normal"

  def set_mode(self, mode: str):
    if mode in ["normal", "meeting"]:
      self.mode = mode
      print(f"[Voice Engine] Operational mode set to: {self.mode}")
      if self.mode == "normal":
        context_window.clear()

  def get_mode(self) -> str:
    return self.mode

  def start(self):
    if self.is_running:
      print("[Voice Engine] Worker is already running.")
      return True

    self.stop_event.clear()
    self.worker_thread = threading.Thread(target=self._run, daemon=True)
    self.worker_thread.start()
    self.is_running = True
    broadcast_event("voice_status", {"status": "starting", "is_running": True})
    return True

  def stop(self):
    if not self.is_running:
      return

    print("[Voice Engine] Stopping voice worker...")
    self.stop_event.set()
    if self.ws and self.ws.sock and self.ws.sock.connected:
      try:
        self.ws.send(json.dumps({"type": "Terminate"}))
        self.ws.close()
      except Exception:
        pass
    self.is_running = False
    broadcast_event("voice_status", {"status": "stopped", "is_running": False})
    broadcast_event("agent_state", {"state": "Idle"})

  def _stream_audio(self, ws):
    audio = None
    stream = None
    try:
      audio = pyaudio.PyAudio()
      if audio.get_device_count() == 0:
        print("[Voice Engine] No audio input devices found.")
        broadcast_event(
            "voice_status",
            {"status": "error", "message": "No audio input devices found"},
        )
        return

      stream = audio.open(
          format=pyaudio.paInt16,
          channels=1,
          rate=16000,
          input=True,
          frames_per_buffer=1600,
      )
      print("[Voice Engine] Microphone recording stream active.")
      broadcast_event(
          "voice_status", {"status": "recording", "is_running": True}
      )
      broadcast_event("agent_state", {"state": "Listening"})

      while not self.stop_event.is_set():
        chunk = stream.read(1600, exception_on_overflow=False)
        if ws and ws.sock and ws.sock.connected:
          ws.send(chunk, websocket.ABNF.OPCODE_BINARY)

    except Exception as e:
      print(f"[Voice Engine] Microphone stream error: {e}")
      broadcast_event("voice_status", {"status": "error", "message": str(e)})
    finally:
      if stream:
        try:
          stream.stop_stream()
          stream.close()
        except Exception:
          pass
      if audio:
        try:
          audio.terminate()
        except Exception:
          pass
      print("[Voice Engine] Microphone stream closed.")

  def _on_open(self, ws):
    print(
        "[Voice Engine] Connected to AssemblyAI WebSocket. Listening"
        " passively..."
    )
    broadcast_event(
        "voice_status", {"status": "connected", "is_running": True}
    )
    broadcast_event("agent_state", {"state": "Listening"})
    threading.Thread(target=self._stream_audio, args=(ws,), daemon=True).start()

  def _process_turn(self, transcript: str):
    """Processes a completed speech turn based on operational mode."""
    if self.mode == "normal":
      # Normal Mode: Gatekeeper and sliding window are bypassed, running agent directly on turn
      try:
        context_window.clear()
        broadcast_event("agent_state", {"state": "Thinking"})
        answer = run_agent(transcript,"normal")
        print("[Voice Engine] Agent Execution Finished (Normal Mode):", answer)
        broadcast_event("agent_state", {"state": "Idle"})
      except Exception as e:
        print(f"[Voice Engine] Error processing turn in Normal Mode: {e}")
        broadcast_event("agent_state", {"state": "Idle"})
    else:
      # Autonomous "Meeting Mode": checks intent via Gatekeeper (< 200ms) before calling Agent
      try:
        # 1. Slide newest turn into context buffer
        context_window.append(transcript)

        # 2. Fast check with Gatekeeper (< 200ms) and latency measurement
        t0 = time.time()
        prompt = f"Context: {' '.join(context_window)}\nLatest: {transcript}"

        
        decision = check_gate(
            latest_speech=transcript,
            context_list=list(context_window),  
        )


        latency_ms = (time.time() - t0) * 1000.0



        print(
            f"[Gatekeeper] Trigger: {decision.trigger} | Conf:"
            f" {decision.confidence:.2f} | Latency: {latency_ms:.1f}ms"
        )

        # Broadcast gate_eval event for HUD metrics
        broadcast_event("gate_eval", {
            "trigger": bool(decision.trigger),
            "confidence": float(decision.confidence),
            "latency_ms": round(latency_ms, 1)
        })

        # 3. Only run agent if threshold is satisfied
        if decision.trigger and decision.confidence >= 0.75:

          
          print(
              f"[Gatekeeper Approved] Triggering agent for: '{transcript}'"
          )
          broadcast_event("agent_state", {"state": "Thinking"})

          # Send full multi-turn context so pronouns resolve
          hydrated_query = " ".join(context_window)
          answer = run_agent(hydrated_query,"meeting")
          print("[Voice Engine] Agent Execution Finished (Meeting Mode):", answer)
          context_window.clear()

          broadcast_event("agent_state", {"state": "Idle"})
        else:
          print(f"[Gatekeeper Ignored] Banter/Irrelevant: '{transcript}'")
          broadcast_event("agent_state", {"state": "Listening"})

      except Exception as e:
        print(f"[Voice Engine] Error processing ambient turn in Meeting Mode: {e}")
        broadcast_event("agent_state", {"state": "Idle"})

  def _on_message(self, ws, message):
    try:
      data = json.loads(message)
    except Exception:
      return

    if data.get("type") == "Turn":
      transcript = data.get("transcript", "").strip()
      end_of_turn = data.get("end_of_turn", False)

      if not transcript:
        return

      if end_of_turn:
        # Deduplicate rapid identical turns from AssemblyAI
        now = time.time()
        if transcript == self.last_final_transcript and (
            now - self.last_final_time < 3.0
        ):
          print(
              "\n[Voice Engine] Ignoring duplicate final turn:"
              f" {transcript}"
          )
          return

        self.last_final_transcript = transcript
        self.last_final_time = now

        print("\n[Transcript Final]:", transcript)
        broadcast_event(
            "user_speech", {"transcript": transcript, "is_final": True}
        )

        # Offload gatekeeper check to background thread so audio loop never stutters
        threading.Thread(
            target=self._process_turn, args=(transcript,), daemon=True
        ).start()
      else:
        print(f"\rLIVE: {transcript}", end="", flush=True)
        broadcast_event(
            "user_speech", {"transcript": transcript, "is_final": False}
        )
        broadcast_event("agent_state", {"state": "Listening"})

  def _on_error(self, ws, error):
    print("\n[Voice Engine] AssemblyAI WebSocket Error:", error)
    broadcast_event("voice_status", {"status": "error", "message": str(error)})
    self.stop_event.set()
    self.is_running = False

  def _on_close(self, ws, status, msg):
    print("\n[Voice Engine] AssemblyAI WebSocket Disconnected.")
    self.is_running = False
    broadcast_event(
        "voice_status", {"status": "disconnected", "is_running": False}
    )
    broadcast_event("agent_state", {"state": "Idle"})

  def _run(self):
    if not ASSEMBLY_API_KEY:
      print("[Voice Engine] ASSEMBLYAI_API_KEY not set.")
      broadcast_event(
          "voice_status",
          {"status": "error", "message": "Missing ASSEMBLYAI_API_KEY"},
      )
      self.is_running = False
      return

    self.ws = websocket.WebSocketApp(
        API_ENDPOINT,
        header={"Authorization": ASSEMBLY_API_KEY},
        on_open=self._on_open,
        on_message=self._on_message,
        on_error=self._on_error,
        on_close=self._on_close,
    )

    try:
      self.ws.run_forever()
    except Exception as e:
      print(f"[Voice Engine] Exception in run_forever: {e}")
    finally:
      self.is_running = False


# Global singleton instance
voice_worker = VoiceEngineWorker()


def get_voice_worker() -> VoiceEngineWorker:
  return voice_worker


def start_voice_worker():
  return voice_worker.start()


def stop_voice_worker():
  return voice_worker.stop()


def is_voice_worker_running():
  return voice_worker.is_running


def set_mode(mode: str):
  voice_worker.set_mode(mode)


def get_mode() -> str:
  return voice_worker.get_mode()


def main():
  """CLI Entry point for running voice engine standalone."""
  print("Starting Ambient Voice Engine CLI...")
  worker = VoiceEngineWorker()
  worker.start()
  try:
    while True:
      time.sleep(1)
  except KeyboardInterrupt:
    worker.stop()
    print("Voice Engine CLI stopped.")


if __name__ == "__main__":
  main()