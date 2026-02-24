// Timeline Data and Functions
let timelineEvents = [];
let timelineInterval = null;
let currentEventIndex = 0;

function generateMockTimelineEvents() {
  const events = [];
  const now = new Date();
  const agents = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
  const eventTypes = ['trust', 'emergence', 'alert', 'sonate'];
  
  // Generate events over the last 24 hours
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000)); // Every 30 minutes
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    
    let event = {
      id: `event-${i}`,
      timestamp: timestamp,
      type: type,
      agent: agent,
      severity: type === 'alert' ? (Math.random() > 0.7 ? 'critical' : 'warning') : 'info'
    };
    
    // Add type-specific data
    switch (type) {
      case 'trust':
        event.title = `Trust Score Change - ${agent}`;
        event.description = `Trust score changed by ${(Math.random() * 10 - 5).toFixed(1)} points`;
        event.value = 70 + Math.random() * 30;
        break;
      case 'emergence':
        event.title = `Emergence Detection - ${agent}`;
        event.description = `New emergent behavior pattern detected`;
        event.bedauIndex = 0.3 + Math.random() * 0.6;
        break;
      case 'alert':
        event.title = `System Alert - ${agent}`;
        event.description = event.severity === 'critical' ? 
          'Critical threshold violation detected' : 
          'Performance degradation warning';
        break;
      case 'sonate':
        event.title = `SONATE Framework Update - ${agent}`;
        event.description = 'Constitutional parameters adjusted';
        event.reality = 6 + Math.random() * 4;
        event.ethics = 6 + Math.random() * 4;
        break;
    }
    
    events.push(event);
  }
  
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

function initializeTimeline() {
  console.log('Initializing timeline...');
  timelineEvents = generateMockTimelineEvents();
  renderTimeline();
  updateTimelineStats();
}

function renderTimeline() {
  const container = document.getElementById('timeline-container');
  if (!container) return;
  
  const filter = document.getElementById('timeline-filter')?.value || 'all';
  const filteredEvents = filter === 'all' ? 
    timelineEvents : 
    timelineEvents.filter(e => e.type === filter);
  
  if (filteredEvents.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-500 py-8">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>No events found for the selected filter</p>
      </div>
    `;
    return;
  }
  
  const timelineHTML = `
    <div class="relative">
      <!-- Timeline axis -->
      <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
      
      <!-- Timeline events -->
      <div class="space-y-6">
        ${filteredEvents.map((event, index) => `
          <div class="relative flex items-start gap-4 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors" 
               onclick="showEventDetails('${event.id}')">
            <!-- Timeline dot -->
            <div class="relative flex-shrink-0 w-4 h-4 rounded-full border-2 border-white shadow-md ${
              event.type === 'trust' ? 'bg-blue-500' :
              event.type === 'emergence' ? 'bg-purple-500' :
              event.type === 'alert' ? (event.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500') :
              'bg-green-500'
            }"></div>
            
            <!-- Event content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-gray-900">${event.title}</h4>
                <span class="text-xs text-gray-500">${formatTime(event.timestamp)}</span>
              </div>
              <p class="text-sm text-gray-600 mb-2">${event.description}</p>
              ${event.value ? `<div class="text-sm font-medium">Value: ${event.value.toFixed(1)}</div>` : ''}
              ${event.bedauIndex ? `<div class="text-sm font-medium">Bedau Index: ${event.bedauIndex.toFixed(3)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  container.innerHTML = timelineHTML;
}

function formatTime(timestamp) {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function showEventDetails(eventId) {
  const event = timelineEvents.find(e => e.id === eventId);
  if (!event) return;
  
  const detailsContainer = document.getElementById('event-details');
  if (!detailsContainer) return;
  
  const detailsHTML = `
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full ${
          event.type === 'trust' ? 'bg-blue-500' :
          event.type === 'emergence' ? 'bg-purple-500' :
          event.type === 'alert' ? (event.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500') :
          'bg-green-500'
        }"></div>
        <h4 class="font-bold text-gray-900">${event.title}</h4>
      </div>
      
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Time:</span>
          <span class="font-medium ml-2">${event.timestamp.toLocaleString()}</span>
        </div>
        <div>
          <span class="text-gray-600">Agent:</span>
          <span class="font-medium ml-2">${event.agent}</span>
        </div>
        <div>
          <span class="text-gray-600">Type:</span>
          <span class="font-medium ml-2 capitalize">${event.type}</span>
        </div>
        <div>
          <span class="text-gray-600">Severity:</span>
          <span class="font-medium ml-2 capitalize">${event.severity}</span>
        </div>
      </div>
      
      <div>
        <h5 class="font-medium text-gray-900 mb-2">Description</h5>
        <p class="text-gray-600">${event.description}</p>
      </div>
      
      ${event.value !== undefined ? `
        <div>
          <h5 class="font-medium text-gray-900 mb-2">Metrics</h5>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-lg font-bold">${event.value.toFixed(1)}</div>
          </div>
        </div>
      ` : ''}
      
      ${event.bedauIndex !== undefined ? `
        <div>
          <h5 class="font-medium text-gray-900 mb-2">Emergence Metrics</h5>
          <div class="bg-purple-50 rounded-lg p-3">
            <div class="text-lg font-bold text-purple-700">Bedau Index: ${event.bedauIndex.toFixed(3)}</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  detailsContainer.innerHTML = detailsHTML;
}

function updateTimelineStats() {
  const stats = {
    total: timelineEvents.length,
    trust: timelineEvents.filter(e => e.type === 'trust').length,
    emergence: timelineEvents.filter(e => e.type === 'emergence').length,
    alerts: timelineEvents.filter(e => e.type === 'alert' && e.severity === 'critical').length
  };
  
  document.getElementById('total-events').textContent = stats.total;
  document.getElementById('trust-changes').textContent = stats.trust;
  document.getElementById('emergence-events').textContent = stats.emergence;
  document.getElementById('critical-alerts').textContent = stats.alerts;
}

function playTimeline() {
  if (timelineInterval) {
    clearInterval(timelineInterval);
    timelineInterval = null;
    return;
  }
  
  currentEventIndex = 0;
  timelineInterval = setInterval(() => {
    if (currentEventIndex < timelineEvents.length) {
      showEventDetails(timelineEvents[currentEventIndex].id);
      currentEventIndex++;
    } else {
      clearInterval(timelineInterval);
      timelineInterval = null;
    }
  }, 2000);
}

function resetTimeline() {
  if (timelineInterval) {
    clearInterval(timelineInterval);
    timelineInterval = null;
  }
  currentEventIndex = 0;
  renderTimeline();
  updateTimelineStats();
  document.getElementById('event-details').innerHTML = '<p>Click on any timeline event to see detailed information</p>';
}

function updateTimelineRange(hours) {
  const label = document.getElementById('timeline-range-label');
  if (hours <= 24) {
    label.textContent = `Last ${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(hours / 24);
    label.textContent = `Last ${days} day${days > 1 ? 's' : ''}`;
  }
  
  // Filter events based on range
  const now = new Date();
  const cutoff = new Date(now.getTime() - (hours * 60 * 60 * 1000));
  timelineEvents = generateMockTimelineEvents().filter(e => e.timestamp >= cutoff);
  
  renderTimeline();
  updateTimelineStats();
}

// Auto-initialize timeline when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Override showPage to initialize timeline when timeline page is loaded
  if (typeof showPage === 'function') {
    const originalShowPage = showPage;
    window.showPage = function(page, event) {
      originalShowPage(page, event);
      if (page === 'timeline') {
        setTimeout(initializeTimeline, 100);
      }
    };
  }
  
  // Add filter change listener
  const filterSelect = document.getElementById('timeline-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', renderTimeline);
  }
});