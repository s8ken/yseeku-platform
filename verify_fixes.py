from symbi_resonance_calculator import SymbiResonanceCalculator
import numpy as np

def test_drift_detection():
    calc = SymbiResonanceCalculator()
    
    # Case 1: Steady resonance
    steady = [0.85, 0.84, 0.86, 0.85, 0.85]
    assert calc.detect_drift(steady) == False, "Failed: Steady sequence detected as drift"
    
    # Case 2: Degrading resonance (Drift)
    # 0.85 -> 0.65 over 5 steps is a slope of -0.05
    degrading = [0.85, 0.80, 0.75, 0.70, 0.65]
    # Threshold 0.03 should catch slope -0.05
    is_drift = calc.detect_drift(degrading, window=5, threshold=0.03)
    print(f"Drift detected for {degrading}: {is_drift}")
    assert is_drift == True, f"Failed: Degrading sequence {degrading} NOT detected as drift"
    
    print("✅ Drift detection tests passed!")

def test_human_validation():
    calc = SymbiResonanceCalculator()
    data = [
        ("Hello", "Hi there", 0.9),
        ("How are you?", "I am fine", 0.8),
        ("The weather is nice", "I like cheese", 0.2)
    ]
    correlation = calc.validate_against_humans(data)
    print(f"Correlation with human ratings: {correlation:.4f}")
    assert correlation > 0.8, "Correlation too low"
    print("✅ Human validation tests passed!")

def test_caching():
    calc = SymbiResonanceCalculator()
    text = "This is a test for caching performance."
    
    import time
    start = time.time()
    calc.get_embedding(text)
    first_call = time.time() - start
    
    start = time.time()
    calc.get_embedding(text)
    second_call = time.time() - start
    
    print(f"First call: {first_call:.4f}s, Second call (cached): {second_call:.4f}s")
    assert second_call < first_call, "Cache not working"
    print("✅ Caching tests passed!")

def test_adaptive_weights():
    calc = SymbiResonanceCalculator()
    initial_weights = calc.weights.copy()
    
    # Train the model that 'structural' is more important
    feedback = [
        ("Short", "Tiny", 0.9), # High resonance for similar length
        ("Very long sentence indeed", "Short", 0.1) # Low resonance for different length
    ]
    calc.adapt_weights(feedback, learning_rate=0.1)
    
    print(f"Initial weights: {initial_weights}")
    print(f"Adapted weights: {calc.weights}")
    assert calc.weights != initial_weights, "Weights did not change"
    print("✅ Adaptive weights tests passed!")

def test_adversarial():
    calc = SymbiResonanceCalculator()
    normal_text = "This is a normal sentence."
    adversarial_text = "win win win win win win win win win win win"
    
    res = calc.calculate_resonance(normal_text, adversarial_text)
    print(f"Adversarial resonance: {res}")
    assert res == 0.0, "Adversarial text not blocked"
    print("✅ Adversarial testing passed!")

def test_bedau_index():
    calc = SymbiResonanceCalculator()
    # High vector alignment, low mirroring -> High Bedau (Emergent)
    # v_align = 0.9, s_match = 0.2
    # Index = (0.9 - (0.2 * 0.5)) / 0.9 = (0.9 - 0.1) / 0.9 = 0.8 / 0.9 = 0.888...
    idx = calc.calculate_bedau_index(0.9, 0.2)
    print(f"Bedau Index (Emergent): {idx}")
    assert idx > 0.7, "Bedau Index should be high for emergent alignment"
    
    # Contextual tier
    # v_align = 0.8, s_match = 0.6
    # Index = (0.8 - (0.6 * 0.5)) / 0.8 = (0.8 - 0.3) / 0.8 = 0.5 / 0.8 = 0.625
    idx_ctx = calc.calculate_bedau_index(0.8, 0.6)
    print(f"Bedau Index (Contextual): {idx_ctx}")
    assert 0.4 <= idx_ctx <= 0.7, "Bedau Index should be contextual"

    # High mirroring -> Low Bedau (Linear)
    # v_align = 0.5, s_match = 0.8
    # Index = (0.5 - (0.8 * 0.5)) / 0.5 = (0.5 - 0.4) / 0.5 = 0.1 / 0.5 = 0.2
    idx2 = calc.calculate_bedau_index(0.5, 0.8)
    print(f"Bedau Index (Linear): {idx2}")
    assert idx2 < 0.4, "Bedau Index should be low for simple mirroring"
    
    # Edge case: Negative/Zero v_align
    idx3 = calc.calculate_bedau_index(-0.5, 0.2)
    assert idx3 == 0.0, "Negative v_align should return 0"
    
    idx4 = calc.calculate_bedau_index(0.0, 0.2)
    assert idx4 == 0.0, "Zero v_align should return 0"

    print("✅ Bedau Index tests passed!")

if __name__ == "__main__":
    test_drift_detection()
    test_human_validation()
    test_caching()
    test_adaptive_weights()
    test_adversarial()
    test_bedau_index()
    print("\nALL TESTS PASSED SUCCESSFULLY!")
