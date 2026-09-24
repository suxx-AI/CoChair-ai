import asyncio
import sqlite3
import os
import json
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from event_bridge import get_event_bridge, broadcast_event
from Agent_2 import run_agent, get_database_schema
from Voice_Engine import get_voice_worker, start_voice_worker, stop_voice_worker, speak

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

bridge = get_event_bridge()
voice_worker = get_voice_worker()


def check_database_status() -> Dict[str, Any]:
    """Queries SQLite database.db to verify connection, table count, and row metrics."""
    db_file = "database.db"
    if not os.path.exists(db_file):
        return {
            "connected": False,
            "error": "database.db not found",
            "tables": [],
            "row_counts": {}
        }

    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [row[0] for row in cursor.fetchall()]

        row_counts = {}
        for tbl in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {tbl}")
                count = cursor.fetchone()[0]
                row_counts[tbl] = count
            except Exception:
                row_counts[tbl] = 0

        conn.close()
        return {
            "connected": True,
            "db_path": db_file,
            "tables": tables,
            "row_counts": row_counts,
            "total_records": sum(row_counts.values())
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "tables": [],
            "row_counts": {}
        }


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Set running event loop on the bridge for thread-safe cross-thread scheduling
    loop = asyncio.get_running_loop()
    bridge.set_loop(loop)
    logger.info("Event loop linked to EventBridge.")
    yield
    # Shutdown voice worker if still running
    if voice_worker.is_running:
        voice_worker.stop()
    logger.info("FastAPI server shut down cleanly.")


app = FastAPI(
    title="Voice BI Dashboard API",
    description="Real-Time WebSocket & Event Bridge for Voice Data Analyst",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    speak_audio: bool = False


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Voice BI Dashboard"}


@app.get("/api/db/status")
def db_status():
    return check_database_status()


@app.get("/api/voice/status")
def voice_status():
    return {
        "is_running": voice_worker.is_running,
        "mic_streaming": voice_worker.is_running
    }


@app.post("/api/voice/start")
def voice_start():
    success = start_voice_worker()
    return {"started": success, "is_running": voice_worker.is_running}


@app.post("/api/voice/stop")
def voice_stop():
    voice_worker.stop()
    return {"stopped": True, "is_running": False}


@app.get("/api/mode")
def get_operational_mode():
    return {"mode": voice_worker.get_mode()}


@app.post("/api/mode")
def set_operational_mode(payload: Dict[str, Any]):
    new_mode = payload.get("mode", "normal")
    voice_worker.set_mode(new_mode)
    broadcast_event("mode_status", {"mode": new_mode})
    return {"mode": new_mode}


@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest):
    """
    Accepts text queries from the UI or API, triggers the LangGraph agent,
    emits live events over WebSockets, and optionally speaks the reply.
    """
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Broadcast user speech turn to live transcript
    broadcast_event("user_speech", {
        "transcript": text,
        "is_final": True,
        "source": "text_input"
    })

    # Execute agent in threadpool to prevent blocking the async event loop
    loop = asyncio.get_running_loop()
    answer = await loop.run_in_executor(None, run_agent, text)

    # Optional speech output via ElevenLabs
    if payload.speak_audio:
        loop.run_in_executor(None, speak, answer)

    return {
        "user_query": text,
        "reply": answer
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await bridge.connect(websocket)

    # Push current DB status and voice worker status immediately upon connection
    db_info = check_database_status()
    await websocket.send_text(json.dumps({
        "type": "db_status",
        "data": db_info
    }))

    await websocket.send_text(json.dumps({
        "type": "voice_status",
        "data": {
            "is_running": voice_worker.is_running,
            "status": "recording" if voice_worker.is_running else "stopped"
        }
    }))

    await websocket.send_text(json.dumps({
        "type": "mode_status",
        "data": {
            "mode": voice_worker.get_mode()
        }
    }))

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                msg = json.loads(raw_text)
                msg_type = msg.get("type") or msg.get("action")
                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif msg_type == "set_mode":
                    mode_val = msg.get("mode", "normal")
                    voice_worker.set_mode(mode_val)
                    broadcast_event("mode_status", {"mode": mode_val})
                elif msg_type == "query":
                    query_text = msg.get("text", "")
                    if query_text:
                        broadcast_event("user_speech", {
                            "transcript": query_text,
                            "is_final": True,
                            "source": "ws_client"
                        })
                        loop = asyncio.get_running_loop()
                        answer = await loop.run_in_executor(None, run_agent, query_text)
                        if msg.get("speak", False):
                            loop.run_in_executor(None, speak, answer)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        bridge.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket exception: {e}")
        bridge.disconnect(websocket)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not capture api or ws routes
        if full_path.startswith("api") or full_path.startswith("ws"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
