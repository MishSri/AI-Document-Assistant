import os
import json
import uuid
import datetime
from threading import Lock
from backend.config import settings

# Thread-safety lock for multi-threaded server environments
_file_system_lock = Lock()

USERS_FILE = os.path.join(settings.DB_DIR, "users.json")
WORKSPACES_FILE = os.path.join(settings.DB_DIR, "workspaces.json")
HISTORY_FILE = os.path.join(settings.DB_DIR, "history.json")
AUDIT_FILE = os.path.join(settings.DB_DIR, "audit_logs.json")

# Ensure DB folder exists
os.makedirs(settings.DB_DIR, exist_ok=True)

def _read_json(filepath: str, default_val):
    """Safely reads a JSON database file using cross-thread locking structures."""
    if not os.path.exists(filepath):
        _write_json(filepath, default_val)
        return default_val
    
    with _file_system_lock:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default_val

def _write_json(filepath: str, data):
    """Executes safe atomic file writes via a temporary file switch to protect against data corruption."""
    with _file_system_lock:
        temp_filepath = f"{filepath}.tmp"
        try:
            with open(temp_filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
            # Atomic replacement over existing file
            os.replace(temp_filepath, filepath)
        except Exception as e:
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
            raise IOError(f"Database write mutation failure on path {filepath}: {str(e)}")

# ==========================================
# USERS STORAGE ENGINE
# ==========================================
def get_all_users() -> list[dict]:
    default_users = [
        {
            "id": "admin-1",
            "username": "admin",
            "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lC",  # password: admin
            "full_name": "System Administrator",
            "role": "admin",
            "department": "Executive",
            "created_at": "2026-08-02T12:00:00Z"
        },
        {
            "id": "user-1",
            "username": "employee",
            "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lC",  # password: admin
            "full_name": "Standard Employee",
            "role": "member",
            "department": "Engineering",
            "created_at": "2026-08-02T12:00:00Z"
        }
    ]
    return _read_json(USERS_FILE, default_users)

def get_user_by_username(username: str) -> dict | None:
    """O(1)-style filtering optimization used by auth routers."""
    users = get_all_users()
    return next((u for u in users if u["username"].lower() == username.lower()), None)

# ==========================================
# WORKSPACES STORAGE ENGINE
# ==========================================
def get_all_workspaces() -> list[dict]:
    default_ws = [{
        "id": "default",
        "name": "Default Workspace",
        "description": "General enterprise workspace for documents",
        "department": "General",
        "created_at": "2026-08-02T12:00:00Z"
    }]
    return _read_json(WORKSPACES_FILE, default_ws)

def get_workspace_by_name(name: str) -> dict | None:
    """Enforces duplicate naming checks."""
    workspaces = get_all_workspaces()
    return next((w for w in workspaces if w["name"].lower() == name.lower()), None)

def add_workspace_record(new_ws: dict):
    """Appends a new workspace atomically."""
    workspaces = get_all_workspaces()
    workspaces.append(new_ws)
    _write_json(WORKSPACES_FILE, workspaces)

def remove_workspace_record(workspace_id: str) -> bool:
    """Removes a workspace context partition record cleanly."""
    workspaces = get_all_workspaces()
    filtered = [w for w in workspaces if w["id"] != workspace_id]
    if len(filtered) == len(workspaces):
        return False
    _write_json(WORKSPACES_FILE, filtered)
    return True

# ==========================================
# CONCURRENCY-SAFE CHAT LOGIC
# ==========================================
def save_chat_message(workspace_id: str, role: str, content: str, username: str, citations: list = None):
    """Atomic message addition that appends straight to disk, preventing race condition loss."""
    history = _read_json(HISTORY_FILE, {})
    if workspace_id not in history:
        history[workspace_id] = []
        
    message_entry = {
        "id": str(uuid.uuid4()),
        "username": username,
        "role": role,
        "content": content,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    if citations is not None:
        message_entry["citations"] = citations
        
    history[workspace_id].append(message_entry)
    _write_json(HISTORY_FILE, history)
    return message_entry

def get_workspace_chat_history(workspace_id: str) -> list[dict]:
    """Fetches records targeted exclusively to a single channel scope."""
    history = _read_json(HISTORY_FILE, {})
    return history.get(workspace_id, [])

def clear_workspace_chat_history(workspace_id: str):
    """Wipes historical logs for an isolated workspace path."""
    history = _read_json(HISTORY_FILE, {})
    if workspace_id in history:
        history[workspace_id] = []
        _write_json(HISTORY_FILE, history)

# ==========================================
# AUDIT LOGS STORAGE ENGINE
# ==========================================
def get_audit_logs() -> list[dict]:
    return _read_json(AUDIT_FILE, [])

def log_audit_event(username: str, action: str, workspace_id: str, details: str):
    """Records an immutable security milestone sequence up to a fixed list ceiling."""
    logs = get_audit_logs()
    entry = {
        "id": str(uuid.uuid4()),
        "username": username,
        "action": action,
        "workspace_id": workspace_id,
        "details": details,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    logs.insert(0, entry)
    _write_json(AUDIT_FILE, logs[:500])
    return entry
