import asyncio
import json
import logging
import uuid
import time
from typing import Set, Dict, Any
from datetime import datetime
from fastapi import WebSocket

logger = logging.getLogger("event_bridge")

class EventBridge:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.loop: asyncio.AbstractEventLoop | None = None
        self.history: list = []

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")
        
        # Send connection acknowledgement and current history/state
        welcome_event = {
            "id": f"conn_{int(time.time() * 1000)}",
            "type": "connection_status",
            "data": {
                "status": "connected",
                "timestamp": datetime.now().isoformat(),
                "client_count": len(self.active_connections)
            }
        }
        await websocket.send_text(json.dumps(welcome_event))

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Remaining clients: {len(self.active_connections)}")

    async def _broadcast_async(self, message_str: str):
        disconnected = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                disconnected.add(connection)
        
        for dead_connection in disconnected:
            self.active_connections.discard(dead_connection)

    def broadcast_event(self, event_type: str, data: Dict[str, Any]):
        """
        Thread-safe method to emit an event to all connected WebSocket clients.
        Can be called from sync worker threads (PyAudio, LangGraph) or async tasks.
        """
        event = {
            "id": f"{event_type}_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}",
            "type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        message_str = json.dumps(event)

        # Record in memory history for new connections (cap at last 50)
        self.history.append(event)
        if len(self.history) > 50:
            self.history.pop(0)

        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(self._broadcast_async(message_str), self.loop)
        else:
            try:
                current_loop = asyncio.get_event_loop()
                if current_loop.is_running():
                    current_loop.create_task(self._broadcast_async(message_str))
                else:
                    current_loop.run_until_complete(self._broadcast_async(message_str))
            except Exception as e:
                logger.warning(f"Could not broadcast event: {e}")

# Global singleton instance
bridge = EventBridge()

def get_event_bridge() -> EventBridge:
    return bridge

def broadcast_event(event_type: str, data: Dict[str, Any]):
    bridge.broadcast_event(event_type, data)
