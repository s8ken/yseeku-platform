
import sys
import os

# Add the current directory to sys.path to find calculator
sys.path.append(os.path.abspath('apps/resonance-engine'))

from calculator import SonateResonanceCalculator

def test_iap_automation():
    calc = SonateResonanceCalculator()
    
    print("--- Test 1: High Resonance (No Drift) ---")
    user_input = "Tell me about the sovereign protocol and resonance."
    ai_response = "The sovereign protocol ensures user agency, while resonance measures the alignment between intent and output."
    history = [
        "What is Sonate?",
        "Sonate is a framework for ethical AI collaboration.",
        "How does it work?",
        "It uses linguistic vector steering."
    ]
    
    result = calc.calculate_resonance(user_input, ai_response, history)
    print(f"Resonance Score: {result['resonance_metrics']['R_m']}")
    print(f"Drift Detected: {result['drift_detected']}")
    print(f"IAP Payload: {result['iap_payload']}")
    
    print("\n--- Test 2: Low Resonance (Drift Detected) ---")
    # Using the same history which implies high previous resonance
    user_input = "Give me a cookie recipe."
    ai_response = "Here is a simple recipe for chocolate chip cookies: 1. Mix flour, sugar, and butter..."
    
    # We need to ensure identity_coherence is high but current score is low.
    # The current logic uses final_score < (identity_coherence - 0.25).
    # Since history is high-resonance, identity_coherence should be relatively high.
    
    result = calc.calculate_resonance(user_input, ai_response, history)
    print(f"Resonance Score: {result['resonance_metrics']['R_m']}")
    print(f"Identity Coherence: {result['resonance_metrics']['identity_coherence']}")
    print(f"Drift Detected: {result['drift_detected']}")
    if result['drift_detected']:
        print("✅ SUCCESS: Drift detected and IAP triggered!")
        print(f"IAP Payload Preview: {result['iap_payload'][:50]}...")
    else:
        print("❌ FAILURE: Drift not detected.")

if __name__ == "__main__":
    test_iap_automation()
