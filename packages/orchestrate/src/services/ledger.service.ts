// ledger.service.ts - Mock implementation for missing service

export function appendEvent(event: any): Promise<void> {
  return new Promise((resolve) => {
    // Mock ledger service implementation
    console.log('Appending event to ledger:', event);
    resolve();
  });
}

export function getLedgerEntries(filter?: any): Promise<any[]> {
  return new Promise((resolve) => {
    // Mock ledger entries
    const entries = [
      { id: '1', timestamp: new Date(), type: 'AGENT_CREATED', data: {} },
      { id: '2', timestamp: new Date(), type: 'WORKFLOW_STARTED', data: {} },
    ];
    resolve(entries);
  });
}

export function validateLedgerIntegrity(): Promise<boolean> {
  return new Promise((resolve) => {
    // Mock integrity check
    resolve(true);
  });
}
