export class PolicyOverrideManager {
  constructor() {}
  
  handleOverride(): void {
    // Disabled
  }
}

export function createOverrideManager(): PolicyOverrideManager {
  return new PolicyOverrideManager();
}
