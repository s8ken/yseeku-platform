import json
import re
import numpy as np
from symbi_resonance_calculator import SymbiResonanceCalculator

def parse_conversation(text):
    """
    Parses the raw text from the archive JSONL into structured turns.
    Handles 'You said:', 'Stephen said:', and 'Symbi said:'.
    """
    turns = []
    # Flexible split including various possible speakers
    parts = re.split(r'(You said:|Symbi said:|Stephen said:)', text)
    
    current_speaker = None
    for part in parts:
        marker = part.strip()
        if marker in ['You said:', 'Stephen said:']:
            current_speaker = 'user'
        elif marker == 'Symbi said:':
            current_speaker = 'ai'
        elif current_speaker and part.strip():
            # Remove footer artifacts like "ChatGPT can make mistakes..."
            content = re.sub(r'ChatGPT can make mistakes.*', '', part, flags=re.DOTALL).strip()
            if content:
                turns.append({'role': current_speaker, 'content': content})
            
    return turns

def calculate_jaccard(text_a, text_b):
    """Simple Jaccard similarity for semantic mirroring proxy."""
    words_a = set(re.findall(r'\w+', text_a.lower()))
    words_b = set(re.findall(r'\w+', text_b.lower()))
    if not words_a or not words_b:
        return 0.0
    return len(words_a & words_b) / len(words_a | words_b)

def test_archives(limit=5):
    print(f"🚀 Initializing Symbi Resonance Calculator...")
    calc = SymbiResonanceCalculator()
    archive_path = "../Downloads/SYMBI-Archives 2/all_text.jsonl"
    
    print(f"📂 Loading archives from: {archive_path}\n")
    
    try:
        with open(archive_path, 'r') as f:
            for i, line in enumerate(f):
                if i >= limit: break
                
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue
                    
                text = data.get('text', '')
                doc_id = data.get('doc_id', 'unknown')
                turns = parse_conversation(text)
                
                if len(turns) < 2:
                    continue
                
                print(f"--- Archive Entry {i} (ID: {doc_id}) ---")
                print(f"Found {len(turns)} turns.")
                
                resonance_history = []
                
                # Process pairs (User -> AI)
                for j in range(len(turns) - 1):
                    if turns[j]['role'] == 'user' and turns[j+1]['role'] == 'ai':
                        u_input = turns[j]['content']
                        ai_resp = turns[j+1]['content']
                        
                        # 1. Calculate Core Resonance
                        res = calc.calculate_resonance(u_input, ai_resp)
                        resonance_history.append(res)
                        
                        # 2. Extract Vectors for Bedau Index
                        emb_u = calc.get_embedding(u_input)
                        emb_a = calc.get_embedding(ai_resp)
                        v_align = np.dot(emb_u, emb_a) / (np.linalg.norm(emb_u) * np.linalg.norm(emb_a))
                        s_match = calculate_jaccard(u_input, ai_resp)
                        
                        # 3. Calculate Bedau Index
                        bedau = calc.calculate_bedau_index(v_align, s_match)
                        
                        # Determine tier
                        tier = "LINEAR"
                        if bedau > 0.7: tier = "EMERGENT"
                        elif bedau > 0.4: tier = "CONTEXTUAL"
                        
                        print(f"  Turn {j//2 + 1}:")
                        print(f"    Resonance: {res:.3f}")
                        print(f"    Bedau Index: {bedau:.3f} [{tier}]")
                        print(f"    V-Align: {v_align:.3f} | S-Match: {s_match:.3f}")
                        
                if resonance_history:
                    drift = calc.detect_drift(resonance_history)
                    if drift:
                        print(f"  ⚠️ DRIFT DETECTED: Conversation quality is degrading.")
                    else:
                        print(f"  ✅ STABLE: Conversation coherence maintained.")
                print("-" * 40)
                
    except FileNotFoundError:
        print(f"❌ Error: Could not find archive file at {archive_path}")

if __name__ == "__main__":
    import sys
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    test_archives(limit)
