from flask import Flask, render_template, url_for, request, flash, redirect
import json
import base64
import socket
import threading
import asyncio
import websockets
import signal
import sys
from websockets import WebSocketServerProtocol
from typing import Set

app = Flask(__name__)
app.secret_key = "porthub"

connected_clients: Set[WebSocketServerProtocol] = set()
websocket_threads = []

async def register_client(websocket: WebSocketServerProtocol):
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            await broadcast(message)
    finally:
        connected_clients.remove(websocket)

async def broadcast(message: str):
    print(message)
    if connected_clients:
        await asyncio.wait([client.send(message) for client in connected_clients])

async def websocket_server(port):
    async with websockets.serve(register_client, "localhost", port):
        await asyncio.Future()

def start_websocket(configuration):
    port = configuration["port"]
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.create_task(websocket_server(port))
    loop.run_forever()

def stop_websocket(port):
    for thread in websocket_threads:
        if thread.name == f"WebSocket Thread - {port}":
            thread.stop_event.set()
            thread.join()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/create_config', methods=["POST"])
def create_config():
    passwd = request.form["password"]
    users_count = request.form["users_count"]

    port = find_free_port()

    configuration = {
        "port": port,
        "password": passwd,
        "users_count": users_count
    }
    print(port)
    # Démarrer le serveur WebSocket dans un thread séparé
    thread = threading.Thread(target=start_websocket, args=(configuration,), daemon=True)
    thread.start()
    websocket_threads.append(thread)

    json_configuration = json.dumps(configuration, separators=(',', ':')).encode('utf-8')
    encoded_configuration = base64.b64encode(json_configuration).decode("utf-8")

    flash(f"JSON config (base64 encoded): {encoded_configuration}", "success")

    print("Configuration encodée:", encoded_configuration)
    print("On sauvegarde la config dans AWS, comme ça on pourra la ré-afficher sur la page après refresh")

    return redirect(url_for("panel"))

@app.route('/panel')
def panel():
    # Requête à la DB pour SELECT les configs de l'utilisateur
    # et les afficher dans un tableau avec un bouton démarrer (mon job)
    return render_template('panel.html')

@app.route('/stop_websocket/<int:port>', methods=["POST"])
def stop_websocket_route(port):
    stop_websocket(port)
    flash(f"WebSocket on port {port} stopped.", "success")
    return redirect(url_for("panel"))

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('localhost', 0))
        return s.getsockname()[1]

def signal_handler(sig, frame):
    print('Stopping WebSocket threads...')
    for thread in websocket_threads:
        thread.stop_event.set()
        thread.join()
    print('Exiting...')
    sys.exit(0)

if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    app.run(debug=True)
