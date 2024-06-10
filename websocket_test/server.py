import asyncio
import websockets
from websockets import WebSocketServerProtocol
from typing import Set

connected_clients: Set[WebSocketServerProtocol] = set()

async def register_client(websocket: WebSocketServerProtocol):
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            await broadcast(message)
    finally:
        connected_clients.remove(websocket)

async def broadcast(message: str):
    if connected_clients:
        await asyncio.wait([client.send(message) for client in connected_clients])

async def main():
    async with websockets.serve(register_client, "localhost", 5665):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
