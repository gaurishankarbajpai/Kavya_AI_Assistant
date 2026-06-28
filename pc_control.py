"""
PC Control Engine for Kavya AI Assistant
Full Windows PC control — apps, windows, volume, keyboard, mouse, files, system
"""

import os
import sys
import subprocess
import time
import ctypes
import re

try:
    import pyautogui
    pyautogui.FAILSAFE = False  # Don't crash if mouse goes to corner
    pyautogui.PAUSE = 0.3
except ImportError:
    pyautogui = None

try:
    import psutil
except ImportError:
    psutil = None

try:
    import pyperclip
except ImportError:
    pyperclip = None

try:
    import pygetwindow as gw
except ImportError:
    gw = None

# ===== APP NAME → EXECUTABLE MAPPING =====
APP_MAP = {
    # Browsers
    'chrome': 'chrome', 'google chrome': 'chrome', 'browser': 'chrome',
    'firefox': 'firefox', 'mozilla': 'firefox',
    'edge': 'msedge', 'microsoft edge': 'msedge',
    'brave': 'brave',
    
    # Microsoft Office
    'word': 'winword', 'ms word': 'winword',
    'excel': 'excel', 'ms excel': 'excel',
    'powerpoint': 'powerpnt', 'ppt': 'powerpnt',
    'outlook': 'outlook',
    'onenote': 'onenote',
    
    # Development
    'vscode': 'code', 'vs code': 'code', 'visual studio code': 'code',
    'visual studio': 'devenv',
    'cmd': 'cmd', 'command prompt': 'cmd', 'terminal': 'cmd',
    'powershell': 'powershell',
    'git bash': 'git-bash',
    'python': 'python',
    'node': 'node',
    
    # Media
    'spotify': 'spotify',
    'vlc': 'vlc', 'media player': 'vlc',
    'itunes': 'itunes',
    
    # Communication
    'whatsapp': 'WhatsApp', 'discord': 'Discord', 'telegram': 'Telegram',
    'teams': 'Teams', 'zoom': 'zoom', 'skype': 'Skype',
    'slack': 'slack',
    
    # System Tools
    'notepad': 'notepad',
    'calculator': 'calc', 'calc': 'calc',
    'paint': 'mspaint',
    'snipping tool': 'SnippingTool',
    'task manager': 'taskmgr',
    'control panel': 'control',
    'settings': 'ms-settings:',
    'file explorer': 'explorer', 'explorer': 'explorer',
    'this pc': 'explorer',
    'recycle bin': 'explorer shell:RecycleBinFolder',
    
    # Others
    'steam': 'steam',
    'epic games': 'EpicGamesLauncher',
    'obs': 'obs64',
    'photoshop': 'photoshop',
    'blender': 'blender',
    'audacity': 'audacity',
}

# ===== PROCESS NAME MAPPING (for killing apps) =====
PROCESS_MAP = {
    'chrome': 'chrome.exe',
    'firefox': 'firefox.exe',
    'edge': 'msedge.exe',
    'brave': 'brave.exe',
    'notepad': 'notepad.exe',
    'word': 'WINWORD.EXE',
    'excel': 'EXCEL.EXE',
    'powerpoint': 'POWERPNT.EXE',
    'vscode': 'Code.exe', 'vs code': 'Code.exe',
    'spotify': 'Spotify.exe',
    'vlc': 'vlc.exe',
    'discord': 'Discord.exe',
    'whatsapp': 'WhatsApp.exe',
    'telegram': 'Telegram.exe',
    'teams': 'Teams.exe',
    'zoom': 'Zoom.exe',
    'calculator': 'Calculator.exe', 'calc': 'Calculator.exe',
    'paint': 'mspaint.exe',
    'task manager': 'Taskmgr.exe',
    'obs': 'obs64.exe',
    'steam': 'steam.exe',
}



# ===== COMMAND ALIASES (handle LLM formatting variations) =====
COMMAND_ALIASES = {
    # Volume — LLM often omits underscores
    'VOLUMEUP': 'VOLUME_UP', 'VOLUMEDOWN': 'VOLUME_DOWN', 'VOLUMEMUTE': 'VOLUME_MUTE',
    'VOLUMESET': 'VOLUME_SET', 'VOL_UP': 'VOLUME_UP', 'VOL_DOWN': 'VOLUME_DOWN',
    'VOLUP': 'VOLUME_UP', 'VOLDOWN': 'VOLUME_DOWN', 'VOLMUTE': 'VOLUME_MUTE',
    
    # Brightness
    'BRIGHTNESSUP': 'BRIGHTNESS_UP', 'BRIGHTNESSDOWN': 'BRIGHTNESS_DOWN',
    
    # Window management
    'CLOSEWINDOW': 'CLOSE_WINDOW', 'SWITCHWINDOW': 'SWITCH_WINDOW',
    'MINIMIZEALL': 'MINIMIZE_ALL', 'SHOWDESKTOP': 'SHOW_DESKTOP',
    
    # System
    'LOCKPC': 'LOCK_PC', 'LOCK': 'LOCK_PC',
    'FILEOPEN': 'FILE_OPEN', 'OPENFILE': 'FILE_OPEN',
    'SELECTALL': 'SELECT_ALL',
    'RIGHTCLICK': 'RIGHT_CLICK', 'DOUBLECLICK': 'DOUBLE_CLICK',
    'SCROLLUP': 'SCROLL_UP', 'SCROLLDOWN': 'SCROLL_DOWN',
    'MOUSEMOVE': 'MOUSE_MOVE', 'MOVEMOUSE': 'MOUSE_MOVE', 'MOVE_CURSOR': 'MOUSE_MOVE',
    'MOVECURSOR': 'MOUSE_MOVE', 'CURSOR': 'MOUSE_MOVE',
    'FINDCLICK': 'FIND_CLICK', 'FIND_AND_CLICK': 'FIND_CLICK',
    'FOCUSWINDOW': 'FOCUS', 'FOCUS_WINDOW': 'FOCUS', 'SWITCHTO': 'FOCUS',
    'TASKBARCLICK': 'TASKBAR', 'TASKBAR_CLICK': 'TASKBAR',
    'WIFION': 'WIFI_ON', 'WIFIOFF': 'WIFI_OFF',
    'SYSTEMINFO': 'SYSTEM_INFO', 'SYSINFO': 'SYSTEM_INFO',
    'LISTAPPS': 'LIST_APPS',
    'PLAYPAUSE': 'PLAY_PAUSE', 'NEXTTRACK': 'NEXT_TRACK', 'PREVTRACK': 'PREV_TRACK',
    
    # Legacy
    'OPENCHROME': 'OPEN_CHROME', 'OPENYOUTUBE': 'OPEN_YOUTUBE',
    'PLAYMUSIC': 'PLAY_MUSIC',
}


def execute(command_string):
    """
    Execute a PC control command. 
    command_string format: "ACTION param" or "ACTION"
    Returns (success: bool, message: str)
    """
    if not command_string:
        return False, "Empty command"
    
    command_string = command_string.strip()
    
    # Parse action and parameter
    parts = command_string.split(None, 1)
    action = parts[0].upper()
    param = parts[1].strip() if len(parts) > 1 else ""
    
    # Normalize action using aliases (handle LLM formatting quirks)
    action = COMMAND_ALIASES.get(action, action)
    
    try:
        # ===== APP MANAGEMENT =====
        if action == "OPEN":
            return open_app(param)
        elif action == "CLOSE":
            return close_app(param)
        
        # ===== WEB =====
        elif action == "SEARCH":
            return web_search(param)
        elif action == "URL":
            return open_url(param)
        elif action == "YOUTUBE":
            return youtube_search(param)
        
        # ===== TYPING & KEYBOARD =====
        elif action == "TYPE":
            return type_text(param)
        elif action == "KEY":
            return press_key(param)
        elif action == "HOTKEY":
            return press_hotkey(param)
        
        # ===== VOLUME =====
        elif action == "VOLUME_UP":
            return volume_change(+10)
        elif action == "VOLUME_DOWN":
            return volume_change(-10)
        elif action == "VOLUME_MUTE":
            return volume_mute()
        elif action == "VOLUME_SET":
            try:
                level = int(param)
                return volume_set(level)
            except:
                return False, "Invalid volume level"
        
        # ===== BRIGHTNESS =====
        elif action == "BRIGHTNESS_UP":
            return brightness_change(+10)
        elif action == "BRIGHTNESS_DOWN":
            return brightness_change(-10)
        
        # ===== SCREENSHOT =====
        elif action == "SCREENSHOT":
            return take_screenshot()
        
        # ===== WINDOW MANAGEMENT =====
        elif action == "MINIMIZE":
            return minimize_window()
        elif action == "MAXIMIZE":
            return maximize_window()
        elif action == "CLOSE_WINDOW":
            return close_active_window()
        elif action == "SWITCH_WINDOW":
            return switch_window()
        elif action == "MINIMIZE_ALL":
            return show_desktop()
        elif action == "SHOW_DESKTOP":
            return show_desktop()
        
        # ===== SYSTEM POWER =====
        elif action == "LOCK_PC":
            return lock_pc()
        elif action == "SHUTDOWN":
            return shutdown_pc()
        elif action == "RESTART":
            return restart_pc()
        elif action == "SLEEP":
            return sleep_pc()
        
        # ===== FILE OPERATIONS =====
        elif action == "FILE_OPEN":
            return open_file(param)
        
        # ===== CLIPBOARD =====
        elif action == "COPY":
            return clipboard_copy()
        elif action == "PASTE":
            return clipboard_paste()
        elif action == "SELECT_ALL":
            return select_all()
        
        # ===== MOUSE =====
        elif action == "CLICK":
            return mouse_click(param)
        elif action == "SCROLL_UP":
            return scroll(up=True)
        elif action == "SCROLL_DOWN":
            return scroll(up=False)
        elif action == "RIGHT_CLICK":
            return right_click(param)
        elif action == "DOUBLE_CLICK":
            return double_click(param)
        elif action == "MOUSE_MOVE":
            return mouse_move(param)
        elif action == "DRAG":
            return mouse_drag(param)
        elif action == "FIND_CLICK":
            return find_and_click(param)
        
        # ===== WINDOW FOCUS =====
        elif action == "FOCUS":
            return focus_window(param)
        elif action == "TASKBAR":
            return taskbar_click(param)
        
        # ===== NETWORK =====
        elif action == "WIFI_ON":
            return wifi_control(True)
        elif action == "WIFI_OFF":
            return wifi_control(False)
        
        # ===== SYSTEM INFO =====
        elif action == "BATTERY":
            return get_battery()
        elif action == "SYSTEM_INFO":
            return get_system_info()
        elif action == "LIST_APPS":
            return list_running_apps()
        
        # ===== ARBITRARY COMMAND =====
        elif action == "RUN":
            return run_command(param)
        
        # ===== MEDIA CONTROL =====
        elif action == "PLAY_PAUSE":
            return media_play_pause()
        elif action == "NEXT_TRACK":
            return media_next()
        elif action == "PREV_TRACK":
            return media_prev()
        
        # ===== UNDO/REDO =====
        elif action == "UNDO":
            return undo()
        elif action == "REDO":
            return redo()
        
        # ===== OPEN SPECIFIC (legacy support) =====
        elif action == "OPEN_CHROME":
            return open_app("chrome")
        elif action == "OPEN_YOUTUBE":
            return open_url("https://youtube.com")
        elif action == "PLAY_MUSIC":
            return open_app("spotify")
        
        else:
            return False, f"Unknown command: {action}"
    
    except Exception as e:
        return False, f"Error: {str(e)}"


# ===================================================================
# APP MANAGEMENT
# ===================================================================

def open_app(name):
    """Open an application by name."""
    if not name:
        return False, "No app name provided"
    
    name_lower = name.lower().strip()
    
    # Check our mapping first
    exe = APP_MAP.get(name_lower)
    
    if exe:
        # Special cases for UWP/Store apps
        if exe.startswith('ms-settings'):
            subprocess.Popen(['start', exe], shell=True)
            return True, f"Settings opened"
        if exe.startswith('explorer shell:'):
            subprocess.Popen(['explorer', exe.replace('explorer ', '')], shell=True)
            return True, f"Opened {name}"
        
        try:
            subprocess.Popen(['start', exe], shell=True)
            return True, f"{name} opened"
        except:
            pass
    
    # Fallback: try to start directly
    try:
        subprocess.Popen(['start', name_lower], shell=True)
        return True, f"Trying to open {name}"
    except:
        pass
    
    # Fallback 2: Windows search
    try:
        subprocess.Popen(['start', '', f'shell:AppsFolder\\{name}'], shell=True)
        return True, f"Opening {name} via search"
    except:
        return False, f"Could not find {name}"


def close_app(name):
    """Close an application by killing its process."""
    if not psutil:
        # Fallback without psutil
        proc_name = PROCESS_MAP.get(name.lower(), f"{name}.exe")
        try:
            subprocess.run(['taskkill', '/F', '/IM', proc_name], 
                         capture_output=True, shell=True)
            return True, f"{name} closed"
        except:
            return False, f"Could not close {name}"
    
    name_lower = name.lower().strip()
    proc_name = PROCESS_MAP.get(name_lower, "")
    
    killed = False
    for proc in psutil.process_iter(['name', 'pid']):
        try:
            pname = proc.info['name'].lower()
            if proc_name and pname == proc_name.lower():
                proc.kill()
                killed = True
            elif not proc_name and name_lower in pname:
                proc.kill()
                killed = True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    
    if killed:
        return True, f"{name} closed"
    return False, f"{name} not found running"


# ===================================================================
# WEB
# ===================================================================

def web_search(query):
    """Search Google in default browser."""
    if not query:
        return False, "No search query"
    import urllib.parse
    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
    subprocess.Popen(['start', url], shell=True)
    return True, f"Searching: {query}"


def open_url(url):
    """Open a URL in default browser."""
    if not url:
        return False, "No URL"
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    subprocess.Popen(['start', url], shell=True)
    return True, f"Opening {url}"


def youtube_search(query):
    """Search YouTube."""
    if not query:
        return open_url("https://youtube.com")
    import urllib.parse
    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
    subprocess.Popen(['start', url], shell=True)
    return True, f"YouTube search: {query}"


# ===================================================================
# TYPING & KEYBOARD
# ===================================================================

def type_text(text):
    """Type text in the active window."""
    if not pyautogui:
        return False, "pyautogui not installed"
    if not text:
        return False, "No text to type"
    time.sleep(0.3)
    pyautogui.typewrite(text, interval=0.02) if text.isascii() else pyautogui.write(text)
    return True, f"Typed: {text[:50]}"


def press_key(key):
    """Press a single key."""
    if not pyautogui:
        return False, "pyautogui not installed"
    key = key.lower().strip()
    pyautogui.press(key)
    return True, f"Pressed {key}"


def press_hotkey(combo):
    """Press a key combination like ctrl+c, alt+tab, etc."""
    if not pyautogui:
        return False, "pyautogui not installed"
    keys = [k.strip().lower() for k in combo.split('+')]
    pyautogui.hotkey(*keys)
    return True, f"Pressed {combo}"


# ===================================================================
# VOLUME CONTROL
# ===================================================================

def _get_volume_interface():
    """Get Windows volume interface via pycaw."""
    try:
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        from comtypes import CLSCTX_ALL
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = interface.QueryInterface(IAudioEndpointVolume)
        return volume
    except Exception as e:
        print(f"Volume interface error: {e}")
        return None


def volume_change(delta):
    """Change volume by delta percent (-100 to +100)."""
    vol = _get_volume_interface()
    if vol:
        current = vol.GetMasterVolumeLevelScalar()
        new_level = max(0.0, min(1.0, current + delta / 100.0))
        vol.SetMasterVolumeLevelScalar(new_level, None)
        return True, f"Volume: {int(new_level * 100)}%"
    else:
        # Fallback: use keyboard media keys
        if pyautogui:
            key = 'volumeup' if delta > 0 else 'volumedown'
            for _ in range(abs(delta) // 2):
                pyautogui.press(key)
            return True, f"Volume {'increased' if delta > 0 else 'decreased'}"
        return False, "Cannot control volume"


def volume_mute():
    """Toggle mute."""
    vol = _get_volume_interface()
    if vol:
        is_muted = vol.GetMute()
        vol.SetMute(not is_muted, None)
        return True, "Unmuted" if is_muted else "Muted"
    elif pyautogui:
        pyautogui.press('volumemute')
        return True, "Mute toggled"
    return False, "Cannot mute"


def volume_set(level):
    """Set volume to specific level (0-100)."""
    vol = _get_volume_interface()
    if vol:
        vol.SetMasterVolumeLevelScalar(max(0.0, min(1.0, level / 100.0)), None)
        return True, f"Volume set to {level}%"
    return False, "Cannot set volume"


# ===================================================================
# BRIGHTNESS
# ===================================================================

def brightness_change(delta):
    """Change screen brightness."""
    try:
        result = subprocess.run(
            ['powershell', '-Command', 
             f'(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness'],
            capture_output=True, text=True, timeout=5
        )
        current = int(result.stdout.strip()) if result.stdout.strip().isdigit() else 50
        new_level = max(0, min(100, current + delta))
        subprocess.run(
            ['powershell', '-Command',
             f'(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {new_level})'],
            capture_output=True, timeout=5
        )
        return True, f"Brightness: {new_level}%"
    except Exception as e:
        return False, f"Brightness control failed: {e}"


# ===================================================================
# SCREENSHOT
# ===================================================================

def take_screenshot():
    """Take a screenshot and save to desktop."""
    try:
        from PIL import ImageGrab
        img = ImageGrab.grab()
        desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
        filename = f"kavya_screenshot_{int(time.time())}.png"
        filepath = os.path.join(desktop, filename)
        img.save(filepath)
        return True, f"Screenshot saved: {filepath}"
    except Exception as e:
        # Fallback: Win+PrintScreen
        if pyautogui:
            pyautogui.hotkey('win', 'printscreen')
            return True, "Screenshot taken (saved to Screenshots folder)"
        return False, f"Screenshot failed: {e}"


# ===================================================================
# WINDOW MANAGEMENT
# ===================================================================

def minimize_window():
    """Minimize the active window."""
    if pyautogui:
        pyautogui.hotkey('win', 'down')
        return True, "Window minimized"
    return False, "Cannot minimize"


def maximize_window():
    """Maximize the active window."""
    if pyautogui:
        pyautogui.hotkey('win', 'up')
        return True, "Window maximized"
    return False, "Cannot maximize"


def close_active_window():
    """Close the active window."""
    if pyautogui:
        pyautogui.hotkey('alt', 'f4')
        return True, "Window closed"
    return False, "Cannot close window"


def switch_window():
    """Switch to next window (Alt+Tab)."""
    if pyautogui:
        pyautogui.hotkey('alt', 'tab')
        return True, "Switched window"
    return False, "Cannot switch"


def show_desktop():
    """Show desktop (minimize all)."""
    if pyautogui:
        pyautogui.hotkey('win', 'd')
        return True, "Desktop shown"
    return False, "Cannot show desktop"


def get_active_window_title():
    """Get the title of the currently active window."""
    if gw:
        try:
            win = gw.getActiveWindow()
            return win.title if win else ""
        except:
            return ""
    return ""


# ===================================================================
# SYSTEM POWER
# ===================================================================

def lock_pc():
    """Lock the PC."""
    ctypes.windll.user32.LockWorkStation()
    return True, "PC locked"


def shutdown_pc():
    """Shutdown the PC (30 second delay for safety)."""
    subprocess.Popen(['shutdown', '/s', '/t', '30'], shell=True)
    return True, "PC shutting down in 30 seconds (run 'shutdown /a' to cancel)"


def restart_pc():
    """Restart the PC (30 second delay for safety)."""
    subprocess.Popen(['shutdown', '/r', '/t', '30'], shell=True)
    return True, "PC restarting in 30 seconds"


def sleep_pc():
    """Put PC to sleep."""
    subprocess.Popen(['rundll32.exe', 'powrprof.dll,SetSuspendState', '0', '1', '0'], shell=True)
    return True, "PC going to sleep"


# ===================================================================
# FILE OPERATIONS
# ===================================================================

def open_file(path):
    """Open a file or folder."""
    if not path:
        return False, "No path provided"
    path = path.strip().strip('"').strip("'")
    if os.path.exists(path):
        os.startfile(path)
        return True, f"Opened {path}"
    else:
        # Try common locations
        for base in [os.path.expanduser('~'), 'C:\\', os.path.join(os.path.expanduser('~'), 'Desktop')]:
            full = os.path.join(base, path)
            if os.path.exists(full):
                os.startfile(full)
                return True, f"Opened {full}"
        return False, f"Path not found: {path}"


# ===================================================================
# CLIPBOARD
# ===================================================================

def clipboard_copy():
    """Copy selection (Ctrl+C)."""
    if pyautogui:
        pyautogui.hotkey('ctrl', 'c')
        return True, "Copied"
    return False, "Cannot copy"


def clipboard_paste():
    """Paste (Ctrl+V)."""
    if pyautogui:
        pyautogui.hotkey('ctrl', 'v')
        return True, "Pasted"
    return False, "Cannot paste"


def select_all():
    """Select all (Ctrl+A)."""
    if pyautogui:
        pyautogui.hotkey('ctrl', 'a')
        return True, "Selected all"
    return False, "Cannot select"


# ===================================================================
# MOUSE
# ===================================================================

def mouse_click(coords=""):
    """Click at position. If no coords, click current position."""
    if not pyautogui:
        return False, "pyautogui not installed"
    if coords:
        try:
            parts = coords.replace(',', ' ').split()
            x, y = int(parts[0]), int(parts[1])
            pyautogui.click(x, y)
            return True, f"Clicked at ({x}, {y})"
        except:
            return False, f"Invalid coordinates: {coords}"
    else:
        pyautogui.click()
        return True, "Clicked"


def right_click(coords=""):
    """Right click."""
    if not pyautogui:
        return False, "pyautogui not installed"
    if coords:
        try:
            parts = coords.replace(',', ' ').split()
            x, y = int(parts[0]), int(parts[1])
            pyautogui.rightClick(x, y)
            return True, f"Right-clicked at ({x}, {y})"
        except:
            return False, f"Invalid coordinates: {coords}"
    else:
        pyautogui.rightClick()
        return True, "Right-clicked"


def double_click(coords=""):
    """Double click."""
    if not pyautogui:
        return False, "pyautogui not installed"
    if coords:
        try:
            parts = coords.replace(',', ' ').split()
            x, y = int(parts[0]), int(parts[1])
            pyautogui.doubleClick(x, y)
            return True, f"Double-clicked at ({x}, {y})"
        except:
            return False, f"Invalid coordinates: {coords}"
    else:
        pyautogui.doubleClick()
        return True, "Double-clicked"


def scroll(up=True):
    """Scroll up or down."""
    if pyautogui:
        pyautogui.scroll(5 if up else -5)
        return True, f"Scrolled {'up' if up else 'down'}"
    return False, "Cannot scroll"


def mouse_move(coords):
    """Move mouse cursor to x, y position."""
    if not pyautogui:
        return False, "pyautogui not installed"
    if not coords:
        return False, "No coordinates provided. Use: MOUSE_MOVE 500 300"
    try:
        parts = coords.replace(',', ' ').split()
        x, y = int(parts[0]), int(parts[1])
        pyautogui.moveTo(x, y, duration=0.3)
        return True, f"Cursor moved to ({x}, {y})"
    except:
        return False, f"Invalid coordinates: {coords}"


def mouse_drag(coords):
    """Drag from (x1,y1) to (x2,y2). Format: 'x1 y1 x2 y2'"""
    if not pyautogui:
        return False, "pyautogui not installed"
    if not coords:
        return False, "Use: DRAG 100 200 500 400"
    try:
        parts = coords.replace(',', ' ').split()
        x1, y1, x2, y2 = int(parts[0]), int(parts[1]), int(parts[2]), int(parts[3])
        pyautogui.moveTo(x1, y1, duration=0.2)
        pyautogui.drag(x2 - x1, y2 - y1, duration=0.5)
        return True, f"Dragged from ({x1},{y1}) to ({x2},{y2})"
    except:
        return False, f"Invalid drag coords: {coords}"


def find_and_click(image_or_text):
    """Try to find and click a UI element on screen by image file name."""
    if not pyautogui:
        return False, "pyautogui not installed"
    if not image_or_text:
        return False, "No target specified"
    
    # Try image-based search (if .png file provided)
    if image_or_text.endswith('.png') or image_or_text.endswith('.jpg'):
        try:
            location = pyautogui.locateOnScreen(image_or_text, confidence=0.8)
            if location:
                center = pyautogui.center(location)
                pyautogui.click(center)
                return True, f"Found and clicked {image_or_text}"
            return False, f"Could not find {image_or_text} on screen"
        except Exception as e:
            return False, f"Image search failed: {e}"
    
    # For text — use Windows accessibility/UI automation
    # Fallback: click center of screen
    return False, f"Text-based UI search not available for '{image_or_text}'"


def focus_window(title):
    """Bring a window to front by partial title match."""
    if not gw:
        # Fallback: use Alt+Tab approach
        if pyautogui:
            pyautogui.hotkey('alt', 'tab')
            return True, "Switched window (pygetwindow not installed for targeted focus)"
        return False, "Cannot focus window"
    
    if not title:
        return False, "No window title specified"
    
    try:
        title_lower = title.lower()
        windows = gw.getAllWindows()
        for win in windows:
            if win.title and title_lower in win.title.lower():
                try:
                    if win.isMinimized:
                        win.restore()
                    win.activate()
                    return True, f"Focused: {win.title}"
                except:
                    # Some windows resist activation, try alternative
                    import ctypes
                    ctypes.windll.user32.SetForegroundWindow(win._hWnd)
                    return True, f"Focused: {win.title}"
        return False, f"No window found with title containing '{title}'"
    except Exception as e:
        return False, f"Focus failed: {e}"


def taskbar_click(position):
    """Click on taskbar at nth position (1-based) from left."""
    if not pyautogui:
        return False, "pyautogui not installed"
    try:
        pos = int(position) if position else 1
        # Taskbar icons start roughly at x=50 with 48px spacing, y at bottom of screen
        screen_w, screen_h = pyautogui.size()
        x = 50 + (pos - 1) * 48
        y = screen_h - 22  # Taskbar center
        pyautogui.click(x, y)
        return True, f"Clicked taskbar position {pos} at ({x}, {y})"
    except:
        return False, f"Invalid taskbar position: {position}"


# ===================================================================
# NETWORK
# ===================================================================

def wifi_control(enable):
    """Enable or disable WiFi."""
    action = "enable" if enable else "disable"
    try:
        subprocess.run(
            ['netsh', 'interface', 'set', 'interface', 'Wi-Fi', action],
            capture_output=True, shell=True, timeout=10
        )
        return True, f"WiFi {'enabled' if enable else 'disabled'}"
    except Exception as e:
        return False, f"WiFi control failed: {e}"


# ===================================================================
# SYSTEM INFO
# ===================================================================

def get_battery():
    """Get battery percentage."""
    if psutil:
        battery = psutil.sensors_battery()
        if battery:
            plugged = "charging" if battery.power_plugged else "on battery"
            return True, f"Battery: {battery.percent}% ({plugged})"
        return True, "No battery found (desktop PC)"
    return False, "psutil not installed"


def get_system_info():
    """Get basic system info."""
    info = []
    if psutil:
        cpu = psutil.cpu_percent(interval=0.5)
        ram = psutil.virtual_memory()
        info.append(f"CPU: {cpu}%")
        info.append(f"RAM: {ram.percent}% ({ram.used // (1024**3)}GB / {ram.total // (1024**3)}GB)")
        battery = psutil.sensors_battery()
        if battery:
            info.append(f"Battery: {battery.percent}%")
    return True, " | ".join(info) if info else "System info unavailable"


def list_running_apps():
    """List currently running applications."""
    if not psutil:
        return False, "psutil not installed"
    
    apps = set()
    for proc in psutil.process_iter(['name']):
        try:
            name = proc.info['name']
            if name and not name.startswith(('svc', 'Runtime', 'conhost', 'csrss', 'dwm',
                                             'lsass', 'smss', 'System', 'wininit', 'winlogon')):
                apps.add(name)
        except:
            continue
    
    app_list = sorted(apps)[:30]  # Top 30
    return True, ", ".join(app_list)


# ===================================================================
# ARBITRARY COMMAND
# ===================================================================

def run_command(cmd):
    """Run an arbitrary command."""
    if not cmd:
        return False, "No command specified"
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=15
        )
        output = result.stdout.strip() or result.stderr.strip() or "Done (no output)"
        return True, output[:500]  # Limit output
    except subprocess.TimeoutExpired:
        return False, "Command timed out (15s limit)"
    except Exception as e:
        return False, f"Command failed: {e}"


# ===================================================================
# MEDIA CONTROL
# ===================================================================

def media_play_pause():
    """Play/Pause media."""
    if pyautogui:
        pyautogui.press('playpause')
        return True, "Play/Pause toggled"
    return False, "Cannot control media"


def media_next():
    """Next track."""
    if pyautogui:
        pyautogui.press('nexttrack')
        return True, "Next track"
    return False, "Cannot control media"


def media_prev():
    """Previous track."""
    if pyautogui:
        pyautogui.press('prevtrack')
        return True, "Previous track"
    return False, "Cannot control media"


# ===================================================================
# UNDO / REDO
# ===================================================================

def undo():
    """Undo (Ctrl+Z)."""
    if pyautogui:
        pyautogui.hotkey('ctrl', 'z')
        return True, "Undo done"
    return False, "Cannot undo"


def redo():
    """Redo (Ctrl+Y)."""
    if pyautogui:
        pyautogui.hotkey('ctrl', 'y')
        return True, "Redo done"
    return False, "Cannot redo"


# ===================================================================
# TESTING
# ===================================================================

if __name__ == "__main__":
    print("PC Control Engine - Testing")
    print("=" * 40)
    
    # Test system info
    ok, msg = get_system_info()
    print(f"System: {msg}")
    
    # Test battery
    ok, msg = get_battery()
    print(f"Battery: {msg}")
    
    # Test active window
    title = get_active_window_title()
    print(f"Active Window: {title}")
    
    print("\nAll commands ready!")
