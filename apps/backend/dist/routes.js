"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resonanceController_1 = require("./controllers/resonanceController");
const router = (0, express_1.Router)();
// ... existing routes ...
// The new "Third Mind" Endpoint
router.post('/trust/analyze', resonanceController_1.analyzeInteraction);
exports.default = router;
