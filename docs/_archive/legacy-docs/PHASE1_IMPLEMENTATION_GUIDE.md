# Phase 1 Implementation Guide: Workflows & Trust Receipts

## 🎯 Implementation Overview

**Branch**: `feature/phase1-workflows-trust-receipts`  
**Timeline**: Week 1  
**Files to Modify**: 2 (Layer 1 and Layer 2 demos)  
**Module**: ORCHESTRATE

---

## 📦 Feature 1: Multi-Agent Workflows

### Data Structure Addition

Add to `mockData` object in both demos:

```javascript
workflows: [
  {
    id: 'wf_001',
    name: 'Customer Onboarding',
    description: 'Automated customer verification and account setup',
    status: 'running',
    progress: 60,
    agents: ['Customer Support AI', 'Data Analysis Agent', 'Decision Engine'],
    agentIds: [1, 2, 4],
    tasks: [
      { id: 'task_001', name: 'Identity Verification', status: 'completed', agent: 'Customer Support AI', duration: 1.2 },
      { id: 'task_002', name: 'Risk Assessment', status: 'completed', agent: 'Data Analysis Agent', duration: 2.1 },
      { id: 'task_003', name: 'Credit Check', status: 'running', agent: 'Decision Engine', duration: null },
      { id: 'task_004', name: 'Account Creation', status: 'pending', agent: 'Customer Support AI', duration: null },
      { id: 'task_005', name: 'Welcome Email', status: 'pending', agent: 'Customer Support AI', duration: null }
    ],
    metrics: {
      elapsed: 3.8,
      estimatedTotal: 6.5,
      trustScore: 98,
      tasksComplete: 2,
      tasksTotal: 5
    },
    startTime: '2024-12-26T10:15:00Z',
    priority: 'high'
  },
  {
    id: 'wf_002',
    name: 'Fraud Investigation',
    description: 'Multi-agent fraud detection and analysis',
    status: 'running',
    progress: 35,
    agents: ['Fraud Detection AI', 'Data Analysis Agent'],
    agentIds: [6, 2],
    tasks: [
      { id: 'task_006', name: 'Transaction Analysis', status: 'completed', agent: 'Fraud Detection AI', duration: 0.8 },
      { id: 'task_007', name: 'Pattern Matching', status: 'running', agent: 'Data Analysis Agent', duration: null },
      { id: 'task_008', name: 'Risk Scoring', status: 'pending', agent: 'Fraud Detection AI', duration: null },
      { id: 'task_009', name: 'Alert Generation', status: 'pending', agent: 'Fraud Detection AI', duration: null }
    ],
    metrics: {
      elapsed: 1.5,
      estimatedTotal: 4.2,
      trustScore: 95,
      tasksComplete: 1,
      tasksTotal: 4
    },
    startTime: '2024-12-26T10:22:00Z',
    priority: 'critical'
  },
  {
    id: 'wf_003',
    name: 'Content Moderation',
    description: 'Automated content review and approval',
    status: 'completed',
    progress: 100,
    agents: ['Content Generator', 'Decision Engine'],
    agentIds: [3, 4],
    tasks: [
      { id: 'task_010', name: 'Content Scan', status: 'completed', agent: 'Content Generator', duration: 0.5 },
      { id: 'task_011', name: 'Policy Check', status: 'completed', agent: 'Decision Engine', duration: 0.3 },
      { id: 'task_012', name: 'Approval', status: 'completed', agent: 'Decision Engine', duration: 0.2 }
    ],
    metrics: {
      elapsed: 1.0,
      estimatedTotal: 1.0,
      trustScore: 92,
      tasksComplete: 3,
      tasksTotal: 3
    },
    startTime: '2024-12-26T10:18:00Z',
    endTime: '2024-12-26T10:19:00Z',
    priority: 'medium'
  },
  {
    id: 'wf_004',
    name: 'Recommendation Pipeline',
    description: 'Personalized product recommendations',
    status: 'pending',
    progress: 0,
    agents: ['Recommendation System', 'Data Analysis Agent'],
    agentIds: [5, 2],
    tasks: [
      { id: 'task_013', name: 'User Profiling', status: 'pending', agent: 'Data Analysis Agent', duration: null },
      { id: 'task_014', name: 'Preference Analysis', status: 'pending', agent: 'Recommendation System', duration: null },
      { id: 'task_015', name: 'Product Matching', status: 'pending', agent: 'Recommendation System', duration: null }
    ],
    metrics: {
      elapsed: 0,
      estimatedTotal: 3.5,
      trustScore: 88,
      tasksComplete: 0,
      tasksTotal: 3
    },
    startTime: null,
    priority: 'low'
  }
]
```

### Layer 1: Workflows Page

**Navigation Addition** (after LAB section):

```html
<!-- ORCHESTRATE Module -->
<div class="mb-4">
  <button onclick="toggleSection('orchestrate')" class="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg">
    <span class="flex items-center gap-2">
      <div class="w-1 h-4 bg-green-500 rounded-full"></div>
      ORCHESTRATE
    </span>
    <span class="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">NEW</span>
  </button>
  <div id="orchestrate-section" class="sidebar-section ml-4 mt-1 space-y-1">
    <a href="#" onclick="showPage('workflows', event)" class="nav-link flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
      Workflows
      <span class="ml-auto px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">2</span>
    </a>
  </div>
</div>
```

**Page Content**:

```javascript
workflows: () => `
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Multi-Agent Workflows</h2>
        <p class="text-gray-600 mt-1">Orchestrated workflows across multiple AI agents</p>
      </div>
      <div class="flex gap-2">
        <select class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option>All Workflows</option>
          <option>Running</option>
          <option>Completed</option>
          <option>Pending</option>
        </select>
      </div>
    </div>

    <!-- Workflow Stats -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 border border-gray-200">
        <div class="text-2xl font-bold text-gray-900">${mockData.workflows.length}</div>
        <div class="text-sm text-gray-600">Total Workflows</div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-200">
        <div class="text-2xl font-bold text-green-600">${mockData.workflows.filter(w => w.status === 'running').length}</div>
        <div class="text-sm text-gray-600">Running</div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-200">
        <div class="text-2xl font-bold text-blue-600">${mockData.workflows.filter(w => w.status === 'completed').length}</div>
        <div class="text-sm text-gray-600">Completed</div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-200">
        <div class="text-2xl font-bold text-gray-600">${mockData.workflows.filter(w => w.status === 'pending').length}</div>
        <div class="text-sm text-gray-600">Pending</div>
      </div>
    </div>

    <!-- Workflow Cards -->
    <div class="grid grid-cols-2 gap-6">
      ${mockData.workflows.map(workflow => `
        <div class="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-lg font-bold text-gray-900">${workflow.name}</h3>
                <span class="px-2 py-1 text-xs font-medium rounded-full ${
                  workflow.status === 'running' ? 'bg-green-100 text-green-700' :
                  workflow.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  workflow.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                  'bg-red-100 text-red-700'
                }">
                  ${workflow.status === 'running' ? '▶️ Running' :
                    workflow.status === 'completed' ? '✓ Completed' :
                    workflow.status === 'pending' ? '⏸️ Pending' :
                    '⚠️ Failed'}
                </span>
              </div>
              <p class="text-sm text-gray-600">${workflow.description}</p>
            </div>
            <div class="px-2 py-1 text-xs font-medium rounded ${
              workflow.priority === 'critical' ? 'bg-red-100 text-red-700' :
              workflow.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              workflow.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }">
              ${workflow.priority.toUpperCase()}
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mb-4">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="text-gray-600">Progress</span>
              <span class="font-medium text-gray-900">${workflow.metrics.tasksComplete}/${workflow.metrics.tasksTotal} tasks</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full transition-all duration-500" style="width: ${workflow.progress}%"></div>
            </div>
          </div>

          <!-- Agents -->
          <div class="mb-4">
            <div class="text-sm text-gray-600 mb-2">Agents (${workflow.agents.length})</div>
            <div class="flex flex-wrap gap-2">
              ${workflow.agents.map((agent, idx) => `
                <div class="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                  <div class="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ${agent.charAt(0)}
                  </div>
                  <span class="text-xs text-gray-700">${agent}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Metrics -->
          <div class="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            <div class="text-center">
              <div class="text-xs text-gray-600">Time</div>
              <div class="text-sm font-medium text-gray-900">
                ${workflow.status === 'pending' ? 'Not started' : 
                  workflow.status === 'completed' ? `${workflow.metrics.elapsed.toFixed(1)}s` :
                  `${workflow.metrics.elapsed.toFixed(1)}s / ${workflow.metrics.estimatedTotal.toFixed(1)}s`}
              </div>
            </div>
            <div class="text-center">
              <div class="text-xs text-gray-600">Trust</div>
              <div class="text-sm font-medium text-gray-900">${workflow.metrics.trustScore}%</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-gray-600">Status</div>
              <div class="text-sm font-medium ${
                workflow.status === 'running' ? 'text-green-600' :
                workflow.status === 'completed' ? 'text-blue-600' :
                'text-gray-600'
              }">
                ${workflow.progress}%
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
`
```

---

## 📦 Feature 2: Trust Receipts

### Data Structure Enhancement

Enhance existing `receipts` in `mockData`:

```javascript
receipts: [
  { 
    id: 'TR-2024-001', 
    timestamp: '2024-12-26T14:32:15Z', 
    agent: 'Customer Support AI',
    agentId: 1,
    action: 'Response Generated', 
    hash: 'a3f5b2c8d9e1f4a7b6c5d8e9f1a2b3c4',
    previousHash: '0000000000000000000000000000000000000000',
    merkleRoot: 'f9e8d7c6b5a4938271605948372615049382716',
    verified: true,
    chainPosition: 1,
    trustScore: 92,
    complianceFrameworks: ['GDPR', 'SOC2']
  },
  { 
    id: 'TR-2024-002', 
    timestamp: '2024-12-26T14:31:42Z', 
    agent: 'Data Analysis Agent',
    agentId: 2,
    action: 'Analysis Completed', 
    hash: 'b4g6c3d0e2f5b8c7d9e0f2a3b4c5d6e7',
    previousHash: 'a3f5b2c8d9e1f4a7b6c5d8e9f1a2b3c4',
    merkleRoot: 'f9e8d7c6b5a4938271605948372615049382716',
    verified: true,
    chainPosition: 2,
    trustScore: 88,
    complianceFrameworks: ['GDPR', 'EU AI Act']
  },
  { 
    id: 'TR-2024-003', 
    timestamp: '2024-12-26T14:30:18Z', 
    agent: 'Decision Engine',
    agentId: 4,
    action: 'Decision Made', 
    hash: 'c5h7d4e1f3g9c8d0e1f3a4b5c6d7e8f9',
    previousHash: 'b4g6c3d0e2f5b8c7d9e0f2a3b4c5d6e7',
    merkleRoot: 'f9e8d7c6b5a4938271605948372615049382716',
    verified: true,
    chainPosition: 3,
    trustScore: 94,
    complianceFrameworks: ['SOC2', 'ISO27001']
  },
  { 
    id: 'TR-2024-004', 
    timestamp: '2024-12-26T14:29:55Z', 
    agent: 'Fraud Detection AI',
    agentId: 6,
    action: 'Fraud Check', 
    hash: 'd6i8e5f2g0h0d9e1f4a5b6c7d8e9f0a1',
    previousHash: 'c5h7d4e1f3g9c8d0e1f3a4b5c6d7e8f9',
    merkleRoot: 'f9e8d7c6b5a4938271605948372615049382716',
    verified: true,
    chainPosition: 4,
    trustScore: 91,
    complianceFrameworks: ['GDPR', 'SOC2', 'PCI-DSS']
  }
]
```

### Layer 1: Enhanced Agent Cards

Modify the `agents` page to include trust receipt badges:

```javascript
agents: () => `
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Agent Monitoring</h2>
      <p class="text-gray-600 mt-1">Real-time status and trust metrics for all AI agents</p>
    </div>

    <div class="grid grid-cols-3 gap-6">
      ${mockData.agents.map(agent => {
        const agentReceipts = mockData.receipts.filter(r => r.agentId === agent.id);
        const latestReceipt = agentReceipts[0];
        
        return `
          <div class="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  ${agent.name.charAt(0)}
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">${agent.name}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    ${latestReceipt ? `
                      <span class="flex items-center gap-1 text-xs text-green-600">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                        Trust Receipt
                      </span>
                    ` : ''}
                  </div>
                </div>
              </div>
              <span class="px-2 py-1 text-xs font-medium rounded-full ${
                agent.status === 'healthy' ? 'bg-green-100 text-green-700' :
                agent.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }">
                ${agent.status === 'healthy' ? '✓ Healthy' :
                  agent.status === 'warning' ? '⚠️ Warning' :
                  '⚠️ Critical'}
              </span>
            </div>

            ${trustGauge(agent.trust)}

            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="text-xs text-gray-600 mb-2">Bedau Index: ${agent.index.toFixed(2)}</div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-600">Novelty:</span>
                  <span class="font-medium">${agent.novelty}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Unpredictability:</span>
                  <span class="font-medium">${agent.unpredictability}%</span>
                </div>
              </div>
            </div>

            ${latestReceipt ? `
              <div class="mt-4 pt-4 border-t border-gray-100">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-600">Last verified:</span>
                  <span class="font-medium text-gray-900">${new Date(latestReceipt.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="flex items-center justify-between text-xs mt-1">
                  <span class="text-gray-600">Chain integrity:</span>
                  <span class="font-medium text-green-600">100%</span>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  </div>
`
```

---

## 🔄 Real-Time Updates

Add workflow simulation to the existing update system:

```javascript
// Add to DOMContentLoaded event listener
setInterval(() => {
  // Update running workflows
  mockData.workflows.forEach(workflow => {
    if (workflow.status === 'running') {
      // Increment progress
      workflow.progress = Math.min(100, workflow.progress + Math.random() * 5);
      workflow.metrics.elapsed += 0.3;
      
      // Update task statuses
      workflow.tasks.forEach((task, idx) => {
        if (task.status === 'running' && Math.random() > 0.7) {
          task.status = 'completed';
          task.duration = (Math.random() * 2 + 0.5).toFixed(1);
          workflow.metrics.tasksComplete++;
          
          // Start next task
          if (idx + 1 < workflow.tasks.length) {
            workflow.tasks[idx + 1].status = 'running';
          }
        }
      });
      
      // Complete workflow if all tasks done
      if (workflow.metrics.tasksComplete === workflow.metrics.tasksTotal) {
        workflow.status = 'completed';
        workflow.progress = 100;
        workflow.endTime = new Date().toISOString();
      }
    }
  });
  
  // Generate new trust receipts occasionally
  if (Math.random() < 0.1) {
    const randomAgent = mockData.agents[Math.floor(Math.random() * mockData.agents.length)];
    const newReceipt = {
      id: `TR-2024-${String(mockData.receipts.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      agent: randomAgent.name,
      agentId: randomAgent.id,
      action: ['Response Generated', 'Analysis Completed', 'Decision Made', 'Check Performed'][Math.floor(Math.random() * 4)],
      hash: Math.random().toString(16).substr(2, 32),
      previousHash: mockData.receipts[0]?.hash || '0'.repeat(32),
      merkleRoot: 'f9e8d7c6b5a4938271605948372615049382716',
      verified: true,
      chainPosition: mockData.receipts.length + 1,
      trustScore: randomAgent.trust,
      complianceFrameworks: ['GDPR', 'SOC2']
    };
    mockData.receipts.unshift(newReceipt);
    
    // Keep only last 10 receipts
    if (mockData.receipts.length > 10) {
      mockData.receipts = mockData.receipts.slice(0, 10);
    }
  }
  
  // Refresh current page if it's workflows
  const currentPage = document.querySelector('.nav-link.active')?.textContent.trim().toLowerCase();
  if (currentPage === 'workflows') {
    showPage('workflows', null);
  }
}, 3000);
```

---

## 📝 Implementation Checklist

### Layer 1 Demo (`yseeku-platform-final-demo.html`)

- [ ] Add `workflows` array to `mockData`
- [ ] Enhance `receipts` array with additional fields
- [ ] Add ORCHESTRATE navigation section
- [ ] Add "Workflows" navigation link
- [ ] Implement `workflows` page function
- [ ] Enhance `agents` page with trust receipt badges
- [ ] Add workflow update logic to real-time system
- [ ] Add trust receipt generation to real-time system
- [ ] Test navigation and page rendering
- [ ] Test real-time updates

### Layer 2 Demo (`yseeku-platform-enhanced-canonical.html`)

- [ ] Add same `workflows` and enhanced `receipts` to `mockData`
- [ ] Add ORCHESTRATE navigation section
- [ ] Add "Workflow Orchestration" navigation link
- [ ] Implement detailed workflow orchestration page
- [ ] Add "Trust Receipts" section to Compliance page
- [ ] Implement trust receipt viewer with chain visualization
- [ ] Add verification interface
- [ ] Test all new pages and sections
- [ ] Test real-time updates

### Testing

- [ ] Verify workflows display correctly
- [ ] Verify workflow progress updates in real-time
- [ ] Verify trust receipt badges appear on agent cards
- [ ] Verify new trust receipts generate periodically
- [ ] Test navigation between all pages
- [ ] Test on mobile devices
- [ ] Test accessibility (keyboard navigation)
- [ ] Verify no console errors

---

**Next Step**: Begin implementation with Layer 1 demo modifications.