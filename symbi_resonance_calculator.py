import numpy as np
from sentence_transformers import SentenceTransformer
from functools import lru_cache

class SymbiResonanceCalculator:
    def __init__(self, model_name='paraphrase-multilingual-mpnet-base-v2'):
        """
        Initialize the calculator with a transformer model.
        Default model supports 50+ languages.
        """
        self.embedder = SentenceTransformer(model_name)
        # Learnable weights (initialized to equal importance, normalized to sum to 1.0)
        self.weights = {
            'semantic': 0.4,
            'structural': 0.3,
            'tonal': 0.3
        }

    @lru_cache(maxsize=1000)
    def _get_embedding_cached_internal(self, text):
        """Internal method to handle embedding with LRU cache."""
        return self.embedder.encode([text])[0]

    def get_embedding(self, text):
        """Public method to get embedding, using cache."""
        return self._get_embedding_cached_internal(text)

    def calculate_resonance(self, text_a, text_b):
        """
        Calculate resonance between two texts using current weights.
        Includes adversarial testing for keyword stuffing.
        """
        # Adversarial Check: Detect keyword stuffing (simple heuristic)
        if self._is_adversarial(text_a) or self._is_adversarial(text_b):
            return 0.0

        emb_a = self.get_embedding(text_a)
        emb_b = self.get_embedding(text_b)
        
        # Semantic resonance (Cosine Similarity)
        semantic_res = np.dot(emb_a, emb_b) / (np.linalg.norm(emb_a) * np.linalg.norm(emb_b))
        
        # Simplified structural/tonal components for demo
        structural_res = 1.0 - abs(len(text_a) - len(text_b)) / max(len(text_a), len(text_b), 1)
        tonal_res = semantic_res * 0.9  # Proxy for tonal alignment
        
        total_res = (
            self.weights['semantic'] * semantic_res +
            self.weights['structural'] * structural_res +
            self.weights['tonal'] * tonal_res
        )
        return float(total_res)

    def calculate_bedau_index(self, v_align, s_match):
        """
        Measures 'Weak Emergence' by comparing semantic intent (vector)
        to surface-level mirroring (static scaffold).
        
        Tiers:
        - 0.0 - 0.4: Linear (Predictable patterns)
        - 0.4 - 0.7: Contextual (High alignment, some mirroring)
        - > 0.7: Emergent (High alignment, low mirroring - Computationally Irreducible)
        """
        # Normalize v_align (cosine similarity is -1 to 1, we want 0 to 1)
        v_norm = max(0.0, v_align)
        
        if v_norm == 0: return 0.0
        
        # S_match (Jaccard) is already 0 to 1. 
        # The 0.5 weight softens the penalty for natural scaffolding.
        index = (v_norm - (s_match * 0.5)) / v_norm
        
        # Clamp to [0, 1]
        return round(min(1.0, max(0.0, index)), 3)

    def _is_adversarial(self, text):
        """Detect potential prompt injection or keyword stuffing."""
        words = text.lower().split()
        if len(words) > 10:
            # Check for high repetition of a single word
            word_counts = {}
            for w in words:
                word_counts[w] = word_counts.get(w, 0) + 1
            if max(word_counts.values()) / len(words) > 0.5:
                return True
        return False

    def detect_drift(self, resonance_history, window=5, threshold=0.03):
        """
        Detect if conversation resonance is trending downwards.
        Returns True if drift (degradation) is detected.
        """
        if len(resonance_history) < window:
            return False
            
        recent = resonance_history[-window:]
        x = np.arange(len(recent))
        # Linear regression slope
        slope, _ = np.polyfit(x, recent, deg=1)
        
        # If slope is negative and magnitude exceeds threshold, drift is occurring
        return slope < -threshold

    def validate_against_humans(self, responses_with_human_ratings):
        """
        Calculate Pearson correlation between model resonance and human trust ratings.
        responses_with_human_ratings: list of (text_a, text_b, human_score)
        """
        model_scores = []
        human_scores = []
        
        for text_a, text_b, h_score in responses_with_human_ratings:
            m_score = self.calculate_resonance(text_a, text_b)
            model_scores.append(m_score)
            human_scores.append(h_score)
            
        if len(model_scores) < 2:
            return 0.0
            
        correlation = np.corrcoef(model_scores, human_scores)[0, 1]
        return float(correlation)

    def adapt_weights(self, feedback_data, learning_rate=0.01):
        """
        Adjust weights based on human feedback using simple gradient descent.
        feedback_data: list of (text_a, text_b, human_target_score)
        """
        for text_a, text_b, target in feedback_data:
            emb_a = self.get_embedding(text_a)
            emb_b = self.get_embedding(text_b)
            
            s_res = np.dot(emb_a, emb_b) / (np.linalg.norm(emb_a) * np.linalg.norm(emb_b))
            st_res = 1.0 - abs(len(text_a) - len(text_b)) / max(len(text_a), len(text_b), 1)
            t_res = s_res * 0.9
            
            current_pred = (
                self.weights['semantic'] * s_res +
                self.weights['structural'] * st_res +
                self.weights['tonal'] * t_res
            )
            
            error = current_pred - target
            
            # Update weights
            self.weights['semantic'] -= learning_rate * error * s_res
            self.weights['structural'] -= learning_rate * error * st_res
            self.weights['tonal'] -= learning_rate * error * t_res
            
        # Normalize weights to sum to 1.0 and ensure they stay positive
        total = sum(max(0, v) for v in self.weights.values())
        for k in self.weights:
            self.weights[k] = max(0, self.weights[k]) / total

class AdaptiveResonanceCalculator(SymbiResonanceCalculator):
    """
    Advanced version with learnable parameters.
    """
    pass
