"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketManager = void 0;
exports.createSocketClient = createSocketClient;
function createSocketClient() {
    return {
        async connect() {
            console.log('Mock socket connected');
        },
        async disconnect() {
            console.log('Mock socket disconnected');
        },
        emit(event, data) {
            console.log(`Mock emit ${event}:`, data);
        },
        on(event, handler) {
            console.log(`Mock listener for ${event}`);
        },
        // @ts-ignore
        off(event, handler) {
            console.log(`Mock off for ${event}`);
        },
    };
}
exports.socketManager = createSocketClient();
