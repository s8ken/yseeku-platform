# packages/core/python/test_canonicalize.py
import unittest
import json
from canonicalize import canonical_transcript, sha256_hex

class TestCanonicalization(unittest.TestCase):
    def setUp(self):
        self.base_transcript = {
            'session_id': 'sess_123',
            'created_ms': 1700000000000,
            'model': {'name': 'gpt-4', 'revision': 'v1'},
            'derived': {'seed': '123'},
            'turns': [
                {'role': 'user', 'ts_ms': 1700000001000, 'content': 'Hello   world'},
                {'role': 'assistant', 'ts_ms': 1700000002000, 'content': '“Smart quotes” and — dashes'}
            ]
        }

    def test_determinism(self):
        b1 = canonical_transcript(self.base_transcript)
        b2 = canonical_transcript(self.base_transcript.copy())
        self.assertEqual(sha256_hex(b1), sha256_hex(b2))

    def test_normalization(self):
        t = self.base_transcript.copy()
        t['turns'] = [
            {'role': 'user', 'ts_ms': 100, 'content': '  Too   many    spaces  '},
            {'role': 'assistant', 'ts_ms': 200, 'content': 'Line\r\nEndings\nFixed'}
        ]
        b = canonical_transcript(t)
        s = b.decode('utf-8')
        
        self.assertIn('"content":"Too many spaces"', s)
        self.assertIn('Line\\nEndings\\nFixed', s)

    def test_key_sorting(self):
        messy = {
            'turns': [],
            'derived': {},
            'model': {'revision': 'v1', 'name': 'gpt-4'},
            'created_ms': 123,
            'session_id': 'abc'
        }
        b = canonical_transcript(messy)
        s = b.decode('utf-8')
        
        # Simple check for order
        self.assertTrue(s.find('"created_ms"') < s.find('"derived"'))
        self.assertTrue(s.find('"derived"') < s.find('"model"'))
        self.assertTrue(s.find('"model"') < s.find('"session_id"'))
        self.assertTrue(s.find('"session_id"') < s.find('"turns"'))
        
        # Check nested
        model_part = s.split('"model":{')[1].split('}')[0]
        self.assertTrue(model_part.find('"name"') < model_part.find('"revision"'))

    def test_parity_vectors(self):
        # This test ensures we match the expected output format exactly
        # Input: {"a": 1} -> '{"a":1}' (no spaces)
        simple = {
            'session_id': 's1', 
            'created_ms': 100, 
            'model': {'name':'m1'}, 
            'turns': []
        }
        b = canonical_transcript(simple)
        s = b.decode('utf-8')
        expected = '{"created_ms":100,"derived":{},"model":{"name":"m1","revision":""},"session_id":"s1","turns":[]}'
        self.assertEqual(s, expected)

if __name__ == '__main__':
    unittest.main()
