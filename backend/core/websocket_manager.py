from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # user_id -> list of socket connections
        self.active_connections: Dict[int, List] = {}

    async def connect(self, user_id: int, websocket):
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(json.dumps(message))

    async def broadcast(self, message: dict, user_ids: List[int]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()