"""SSE Stream Manager — manages per-conversation event queues."""

import asyncio
import json
from typing import Any


class StreamManager:
    """Manages asyncio.Queue instances keyed by conversation_id for SSE streaming."""

    def __init__(self):
        self._queues: dict[str, asyncio.Queue] = {}

    def subscribe(self, conversation_id: str) -> asyncio.Queue:
        if conversation_id not in self._queues:
            self._queues[conversation_id] = asyncio.Queue()
        return self._queues[conversation_id]

    def unsubscribe(self, conversation_id: str):
        self._queues.pop(conversation_id, None)

    async def _emit(self, conversation_id: str, event_type: str, data: Any):
        q = self._queues.get(conversation_id)
        if q:
            payload = json.dumps({"type": event_type, "data": data})
            await q.put(f"data: {payload}\n\n")

    async def emit_graph_node(self, conversation_id: str, node_data: dict):
        await self._emit(conversation_id, "graph_node", node_data)

    async def emit_graph_edge(self, conversation_id: str, edge_data: dict):
        await self._emit(conversation_id, "graph_edge", edge_data)

    async def emit_answer_chunk(self, conversation_id: str, text: str):
        await self._emit(conversation_id, "answer_chunk", {"text": text})

    async def emit_error(self, conversation_id: str, message: str):
        await self._emit(conversation_id, "error", {"message": message})

    async def emit_done(self, conversation_id: str):
        await self._emit(conversation_id, "done", {})


# Global singleton
stream_manager = StreamManager()
