# packages/core/python/canonicalize.py
import json
import unicodedata
import re
import hashlib
from collections import OrderedDict
from typing import List, Dict, Any

def normalize_text(s: str) -> str:
    # 1. Unicode NFC
    s = unicodedata.normalize('NFC', s)
    # 2. Normalize line endings to LF
    s = s.replace('\r\n', '\n').replace('\r', '\n')
    # 3. Remove control chars except LF
    s = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', s)
    # 4. Replace smart quotes/dashes
    s = s.replace('“','"').replace('”','"').replace('‘',"'").replace('’',"'")
    s = s.replace('–','-').replace('—','-').replace('«','"').replace('»','"')
    # 5. Collapse whitespace to single space, preserve single \n
    parts = [re.sub(r'\s+', ' ', p).strip() for p in s.split('\n')]
    # 6. Trim
    return '\n'.join(parts).strip()

def sort_keys(obj: Any) -> Any:
    if isinstance(obj, dict):
        # Sort keys and recursively sort values, omitting None
        return OrderedDict(sorted((k, sort_keys(v)) for k, v in obj.items() if v is not None))
    elif isinstance(obj, list):
        return [sort_keys(v) for v in obj]
    else:
        return obj

def canonical_transcript(transcript: Dict) -> bytes:
    # Normalize turns
    turns = []
    for t in transcript.get('turns', []):
        turns.append({
            'role': t['role'],
            'ts_ms': int(t['ts_ms']),
            'model': t.get('model', ''),
            'content': normalize_text(t['content'])
        })

    canonical = {
        'session_id': str(transcript['session_id']),
        'created_ms': int(transcript['created_ms']),
        'model': {
            'name': transcript['model']['name'],
            'revision': transcript['model'].get('revision', '')
        },
        'derived': transcript.get('derived', {}),
        'turns': turns
    }

    sorted_obj = sort_keys(canonical)
    # Deterministic JSON: separators=(',', ':') removes whitespace, ensure_ascii=False for UTF-8
    js = json.dumps(sorted_obj, separators=(',', ':'), ensure_ascii=False)
    return js.encode('utf-8')

def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()
