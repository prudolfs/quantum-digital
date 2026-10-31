"""Run the builder source script through the open local Blender MCP session."""
import json
import socket
from pathlib import Path

root = Path(__file__).resolve().parents[2]
source = root / 'scripts/work/build-builder.py'
code = f"exec(compile(open({str(source)!r}).read(), {str(source)!r}, 'exec'), {{'__file__': {str(source)!r}}})"
request = {'type': 'execute_code', 'params': {'code': code}}
with socket.create_connection(('127.0.0.1', 9876), timeout=10) as connection:
    connection.settimeout(240)
    connection.sendall(json.dumps(request).encode())
    data = b''
    while True:
        chunk = connection.recv(65536)
        if not chunk:
            raise RuntimeError('Blender closed before its response completed')
        data += chunk
        try:
            response = json.loads(data)
            break
        except json.JSONDecodeError:
            continue
print(json.dumps(response, indent=2))
if response.get('status') != 'success':
    raise SystemExit(1)
