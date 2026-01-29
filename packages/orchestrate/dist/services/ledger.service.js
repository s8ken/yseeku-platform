"use strict";
// ledger.service.ts - Mock implementation for missing service
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendEvent = appendEvent;
exports.getLedgerEntries = getLedgerEntries;
exports.validateLedgerIntegrity = validateLedgerIntegrity;
function appendEvent(event) {
    return new Promise((resolve) => {
        // Mock ledger service implementation
        console.log('Appending event to ledger:', event);
        resolve();
    });
}
function getLedgerEntries(filter) {
    return new Promise((resolve) => {
        // Mock ledger entries
        const entries = [
            { id: '1', timestamp: new Date(), type: 'AGENT_CREATED', data: {} },
            { id: '2', timestamp: new Date(), type: 'WORKFLOW_STARTED', data: {} },
        ];
        resolve(entries);
    });
}
function validateLedgerIntegrity() {
    return new Promise((resolve) => {
        // Mock integrity check
        resolve(true);
    });
}
