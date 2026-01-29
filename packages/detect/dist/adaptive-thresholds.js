"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSUMDetector = exports.BayesianOnlineChangePointDetector = exports.AdaptiveThresholdManager = void 0;
// Mock implementation for adaptive thresholds
class AdaptiveThresholdManager {
    async getAdaptiveThresholds(stakes, text) {
        return {
            thresholds: { ethics: 0.75, alignment: 0.7 },
            thresholdUncertainty: 0.05,
        };
    }
    applyThresholds(score, thresholds, stakes) {
        return {
            adjustedScore: score * 0.9,
            adjustmentFactor: 0.9,
        };
    }
}
exports.AdaptiveThresholdManager = AdaptiveThresholdManager;
class BayesianOnlineChangePointDetector {
    getAdaptiveThreshold() {
        return 0.7;
    }
}
exports.BayesianOnlineChangePointDetector = BayesianOnlineChangePointDetector;
class CUSUMDetector {
    getAdaptiveThreshold() {
        return 0.7;
    }
}
exports.CUSUMDetector = CUSUMDetector;
