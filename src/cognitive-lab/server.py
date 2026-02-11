import subprocess
import threading
import json
import time
import os
import random
from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- CONFIIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '../../'))

# 1. C++ Engine Path
CPP_BUILD_DIR = os.path.join(PROJECT_ROOT, 'src/physics-engine/build')
CPP_PATHS = [
    os.path.join(CPP_BUILD_DIR, 'Release', 'tensorwerk_engine.exe'),
    os.path.join(CPP_BUILD_DIR, 'Debug', 'tensorwerk_engine.exe'),
    os.path.join(CPP_BUILD_DIR, 'tensorwerk_engine.exe'),
]
CPP_ENGINE_PATH = next((p for p in CPP_PATHS if os.path.exists(p)), None)

# 2. Rust Nervous System Path
RUST_BUILD_DIR = os.path.join(PROJECT_ROOT, 'src/nervous-system/target/release')
RUST_PATHS = [
    os.path.join(RUST_BUILD_DIR, 'tensorwerk-ingestor.exe'),
    os.path.join(RUST_BUILD_DIR, 'tensorwerk-ingestor'),
]
RUST_ENGINE_PATH = next((p for p in RUST_PATHS if os.path.exists(p)), None)

# --- UTILS ---
def stream_process_output(process, name, log_type='info'):
    """Reads stdout/stderr from a process and emits to WebSocket."""
    for line in iter(process.stdout.readline, ''):
        if not line: break
        line = line.strip()
        if not line: continue
        
        # Detect JSON (C++ Engine)
        if line.startswith('{') and line.endswith('}'):
            try:
                data = json.loads(line)
                if data.get('type') == 'tensor_update':
                    socketio.emit('tensor_update', data)
                else:
                    # Log other JSON messages
                    socketio.emit('system_log', {
                        'message': data.get('message', str(data)), 
                        'type': data.get('type', 'info')
                    })
            except json.JSONDecodeError:
                print(f"[{name} JSON ERR] {line}")
        else:
            # Raw Text Log
            print(f"[{name}] {line}")
            socketio.emit('system_log', {'message': f"[{name}] {line}", 'type': log_type})

def run_cpp_engine():
    if not CPP_ENGINE_PATH:
        print("[Bridge] WARN: C++ Engine not found.")
        return
    
    print(f"[Bridge] Starting C++ Engine: {CPP_ENGINE_PATH}")
    proc = subprocess.Popen(
        [CPP_ENGINE_PATH],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT, # Merge stderr into stdout
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    stream_process_output(proc, "PHYSICS-CORE", "info")

def run_rust_ingestor():
    if not RUST_ENGINE_PATH:
        print("[Bridge] WARN: Rust Ingestor not found. (Run 'cargo build --release' in src/nervous-system)")
        return

    print(f"[Bridge] Starting Rust Ingestor: {RUST_ENGINE_PATH}")
    proc = subprocess.Popen(
        [RUST_ENGINE_PATH],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    stream_process_output(proc, "NERVOUS-SYS", "success")

def simulate_lisp_supervisor():
    """Simulates the Lisp Symbolic Logic Supervisor occasionally injecting 'thoughts'."""
    lisp_events = [
        "Re-deriving Geodesic Equations (Region A)...",
        "Optimizing Hamiltonian for AVX-512...",
        "Symbolic Reducer: Simplification Complete.",
        "Detected Arbitrage Opportunity in R^4 Manifold.",
        "Garbage Collecting Symbolic Heap...",
        "Recalibrating Volatility Surface..."
    ]
    while True:
        time.sleep(random.uniform(5, 15))
        msg = random.choice(lisp_events)
        print(f"[LISP-SUPERVISOR] {msg}")
        socketio.emit('system_log', {'message': f"[SYMBOLIC-LISP] {msg}", 'type': 'warn'})

@socketio.on('connect')
def handle_connect():
    print('[Bridge] Client connected')
    socketio.emit('system_log', {'message': 'BRIDGE: Uplink Established.', 'type': 'success'})

@socketio.on('inject_volatility')
def handle_volatility(data):
    cmd = data.get('command')
    print(f'[Bridge] Command Received: {cmd}')
    socketio.emit('system_log', {'message': f"CORE: Ack command '{cmd}'", 'type': 'warn'})

if __name__ == '__main__':
    # Start Subprocesses
    t_cpp = threading.Thread(target=run_cpp_engine, daemon=True)
    t_cpp.start()

    t_rust = threading.Thread(target=run_rust_ingestor, daemon=True)
    t_rust.start()

    t_lisp = threading.Thread(target=simulate_lisp_supervisor, daemon=True)
    t_lisp.start()

    print("[Bridge] 🟢 Bridge Active on Port 5000")
    socketio.run(app, host='0.0.0.0', port=5000)
