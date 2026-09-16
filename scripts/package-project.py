"""Bundle source + prebuilt game without caches, identity or credentials."""
from pathlib import Path
import hashlib
import json
import os
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / 'public/downloads/wolf3d-hd-project.zip'
assert (root / 'playable/index.html').is_file(), 'Run pnpm build:standalone first.'
skip_dirs = {'.git', 'node_modules', '.next', '.vinext', '.wrangler', '.sites-runtime', '.agents', '.codex', 'dist', 'outputs', 'work', '__pycache__'}
files = []
for parent, dirs, names in os.walk(root):
    dirs[:] = sorted(d for d in dirs if d not in skip_dirs and not (Path(parent) == root / 'public' and d == 'downloads'))
    for name in sorted(names):
        p = Path(parent) / name
        if name.startswith('.env') or name.endswith(('.tsbuildinfo', '.log', '.pem', '.zip')) or p == destination:
            continue
        files.append(p)
destination.parent.mkdir(parents=True, exist_ok=True)
checksums = []
with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for file in files:
        relative = file.relative_to(root).as_posix()
        data = file.read_bytes()
        if relative == '.openai/hosting.json':
            data = (json.dumps({'d1': None, 'r2': None}, indent=2) + '\n').encode()
        archive.writestr('wolf3d-hd/' + relative, data)
        checksums.append(hashlib.sha256(data).hexdigest() + '  ' + relative)
    archive.writestr('wolf3d-hd/SHA256SUMS.txt', '\n'.join(checksums) + '\n')
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    paths = set(archive.namelist())
    for required in ['README.md', 'playable/index.html', 'docs/PRD-01-producto.md', 'docs/PRD-02-graficos-ux.md', 'docs/adr/006-distribucion-y-validacion.md', 'lib/game/engine.js', 'pnpm-lock.yaml']:
        assert 'wolf3d-hd/' + required in paths, required
print(json.dumps({'path': str(destination), 'bytes': destination.stat().st_size, 'files': len(files) + 1, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest()}))
