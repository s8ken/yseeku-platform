// Yseeku Layer Sync Engine
// Synchronizes data between Layer 1 (human-facing) and Layer 2 (expert/audit) interfaces

class LayerSyncEngine {
    constructor() {
        this.channel = new BroadcastChannel('yseeku-layer-sync');
        this.listeners = new Map();
        this.syncState = {
            layer1Active: false,
            layer2Active: false,
            lastSync: null,
            syncCount: 0
        };
        
        // Initialize sync channel
        this.initializeChannel();
        
        // Register this layer
        this.registerLayer();
    }

    initializeChannel() {
        this.channel.onmessage = (event) => {
            const { type, data, timestamp, source } = event.data;
            
            console.log(`[Layer Sync] Received ${type} from ${source}`, data);
            
            // Update sync state
            this.syncState.lastSync = timestamp;
            this.syncState.syncCount++;
            
            // Trigger registered listeners
            if (this.listeners.has(type)) {
                this.listeners.get(type).forEach(callback => {
                    try {
                        callback(data, source);
                    } catch (error) {
                        console.error(`[Layer Sync] Error in listener for ${type}:`, error);
                    }
                });
            }
            
            // Handle specific message types
            this.handleMessage(type, data, source);
        };
    }

    registerLayer() {
        const isLayer1 = window.location.pathname.includes('final-demo');
        const isLayer2 = window.location.pathname.includes('enhanced-canonical');
        
        if (isLayer1) {
            this.syncState.layer1Active = true;
            this.broadcast('layer-register', { layer: 'layer1', status: 'active' });
        } else if (isLayer2) {
            this.syncState.layer2Active = true;
            this.broadcast('layer-register', { layer: 'layer2', status: 'active' });
        }
    }

    handleMessage(type, data, source) {
        switch (type) {
            case 'layer-register':
                console.log(`[Layer Sync] ${data.layer} registered as ${data.status}`);
                if (data.layer === 'layer1') this.syncState.layer1Active = true;
                if (data.layer === 'layer2') this.syncState.layer2Active = true;
                break;
                
            case 'agent-update':
                this.handleAgentUpdate(data, source);
                break;
                
            case 'trust-score-change':
                this.handleTrustScoreChange(data, source);
                break;
                
            case 'emergence-event':
                this.handleEmergenceEvent(data, source);
                break;
                
            case 'alert-triggered':
                this.handleAlert(data, source);
                break;
                
            case 'scenario-change':
                this.handleScenarioChange(data, source);
                break;
                
            case 'compliance-update':
                this.handleComplianceUpdate(data, source);
                break;
                
            case 'diagnostic-result':
                this.handleDiagnosticResult(data, source);
                break;
        }
    }

    // Public API for broadcasting messages
    broadcast(type, data) {
        const message = {
            type,
            data,
            timestamp: new Date().toISOString(),
            source: this.getLayerIdentifier()
        };
        
        this.channel.postMessage(message);
        console.log(`[Layer Sync] Broadcast ${type}:`, data);
    }

    // Register a listener for specific message types
    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
        
        return () => {
            const callbacks = this.listeners.get(type);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    // Remove all listeners for a type
    off(type) {
        this.listeners.delete(type);
    }

    // Get current layer identifier
    getLayerIdentifier() {
        if (window.location.pathname.includes('final-demo')) return 'layer1';
        if (window.location.pathname.includes('enhanced-canonical')) return 'layer2';
        return 'unknown';
    }

    // Specific message handlers
    handleAgentUpdate(data, source) {
        // Update agent data in current layer
        if (typeof updateAgentData === 'function') {
            updateAgentData(data);
        }
    }

    handleTrustScoreChange(data, source) {
        // Update trust scores
        if (typeof updateTrustScores === 'function') {
            updateTrustScores(data);
        }
        
        // Show notification
        this.showSyncNotification(`Trust score updated: ${data.agent} - ${data.score}%`);
    }

    handleEmergenceEvent(data, source) {
        // Handle emergence events
        if (typeof handleEmergenceEvent === 'function') {
            handleEmergenceEvent(data);
        }
        
        // Show notification
        this.showSyncNotification(`Emergence detected: ${data.type} - Bedau Index: ${data.bedauIndex}`);
    }

    handleAlert(data, source) {
        // Handle alerts
        if (typeof handleAlert === 'function') {
            handleAlert(data);
        }
        
        // Show notification with severity
        const severity = data.severity === 'critical' ? '🚨' : '⚠️';
        this.showSyncNotification(`${severity} Alert: ${data.message}`);
    }

    handleScenarioChange(data, source) {
        // Sync scenario changes between layers
        if (typeof setScenario === 'function' && source !== this.getLayerIdentifier()) {
            setScenario(data.scenario);
        }
        
        this.showSyncNotification(`Scenario changed to: ${data.scenario}`);
    }

    handleComplianceUpdate(data, source) {
        // Update compliance metrics
        if (typeof updateComplianceMetrics === 'function') {
            updateComplianceMetrics(data);
        }
    }

    handleDiagnosticResult(data, source) {
        // Handle diagnostic results
        if (typeof handleDiagnosticResult === 'function') {
            handleDiagnosticResult(data);
        }
    }

    // Show sync notification
    showSyncNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 2s infinite;"></div>
                <div>${message}</div>
            </div>
            <style>
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Get sync status
    getSyncStatus() {
        return {
            ...this.syncState,
            currentLayer: this.getLayerIdentifier(),
            connected: this.syncState.layer1Active || this.syncState.layer2Active
        };
    }

    // Sync specific data types
    syncAgentData(agentData) {
        this.broadcast('agent-update', agentData);
    }

    syncTrustScore(agent, score) {
        this.broadcast('trust-score-change', { agent, score, timestamp: Date.now() });
    }

    syncEmergenceEvent(eventData) {
        this.broadcast('emergence-event', eventData);
    }

    syncAlert(alertData) {
        this.broadcast('alert-triggered', alertData);
    }

    syncScenario(scenario) {
        this.broadcast('scenario-change', { scenario });
    }

    syncCompliance(complianceData) {
        this.broadcast('compliance-update', complianceData);
    }

    syncDiagnostic(diagnosticData) {
        this.broadcast('diagnostic-result', diagnosticData);
    }

    // Request full sync from other layer
    requestFullSync() {
        this.broadcast('sync-request', { 
            layer: this.getLayerIdentifier(),
            timestamp: Date.now()
        });
    }

    // Cleanup
    destroy() {
        this.channel.close();
        this.listeners.clear();
    }
}

// Create global sync engine instance
window.layerSync = new LayerSyncEngine();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayerSyncEngine;
}

console.log('[Layer Sync] Engine initialized successfully');
console.log('[Layer Sync] Status:', window.layerSync.getSyncStatus());