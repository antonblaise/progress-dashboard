import os
import sys
import subprocess
import threading
import time
import webbrowser
from pystray import Icon, Menu, MenuItem
from PIL import Image

# Paths
BACKEND_CMD = ['cmd', '/c', 'cd backend && npm run dev']
FRONTEND_CMD = ['cmd', '/c', 'cd frontend && npm run dev']
ICON_PATH = os.path.join('frontend', 'public', 'undertale-sans.jpg')

BACKEND_URL = 'http://localhost:4000/'
FRONTEND_URL = 'http://localhost:5173/'

# Process handles
backend_proc = None
frontend_proc = None

def is_running(proc):
    return proc is not None and proc.poll() is None

def start_backend():
    global backend_proc
    if not is_running(backend_proc):
        backend_proc = subprocess.Popen(
            BACKEND_CMD,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW
        )

def start_frontend():
    global frontend_proc
    if not is_running(frontend_proc):
        frontend_proc = subprocess.Popen(
            FRONTEND_CMD,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW
        )

def stop_backend():
    global backend_proc
    if is_running(backend_proc):
        backend_proc.terminate()
        backend_proc.wait()
        backend_proc = None
    else:
        backend_proc = None

def stop_frontend():
    global frontend_proc
    if is_running(frontend_proc):
        frontend_proc.terminate()
        frontend_proc.wait()
        frontend_proc = None
    else:
        frontend_proc = None

def open_frontend(icon, item=None):
    webbrowser.open(FRONTEND_URL)

def open_backend(icon, item=None):
    webbrowser.open(BACKEND_URL)

def update_menu(icon):
    # Simple menu: frontend, backend, exit
    icon.menu = Menu(
        MenuItem(
            "Frontend",
            open_frontend,
            enabled=is_running(frontend_proc)
        ),
        MenuItem(
            "Backend",
            open_backend,
            enabled=is_running(backend_proc)
        ),
        MenuItem('Exit', lambda icon, item: exit_launcher(icon))
    )
    icon.update_menu()

def exit_launcher(icon):
    stop_backend()
    stop_frontend()
    icon.stop()

def menu_builder(icon):
    # Periodically update menu to reflect status
    while icon.visible:
        # Check if backend process has exited unexpectedly
        global backend_proc, frontend_proc
        if backend_proc and not is_running(backend_proc):
            backend_proc = None
        if frontend_proc and not is_running(frontend_proc):
            frontend_proc = None
        update_menu(icon)
        time.sleep(2)

def main():
    # Start both servers
    start_backend()
    start_frontend()

    # Open frontend in browser after starting
    time.sleep(2)  # Give frontend a moment to start
    webbrowser.open(FRONTEND_URL)

    # Load icon image
    if not os.path.exists(ICON_PATH):
        print(f"Icon not found: {ICON_PATH}")
        sys.exit(1)
    image = Image.open(ICON_PATH)

    # Initial menu
    menu = Menu(
        MenuItem(
            "Frontend",
            open_frontend,
            enabled=is_running(frontend_proc)
        ),
        MenuItem(
            "Backend",
            open_backend,
            enabled=is_running(backend_proc)
        ),
        MenuItem('Exit', lambda icon, item: exit_launcher(icon))
    )

    icon = Icon("ProgressDashboard", image, "Progress Dashboard", menu)

    # Start menu updater thread
    updater_thread = threading.Thread(target=menu_builder, args=(icon,), daemon=True)
    updater_thread.start()

    icon.run()

if __name__ == '__main__':
    main()