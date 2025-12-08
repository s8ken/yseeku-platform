import React, { useState, useEffect } from 'react';
import { Shield, Activity, Eye, Users, FileText } from 'lucide-react';
import { TrustPillarCard } from './components/TrustPillarCard';
import { ReceiptChain } from './components/ReceiptChain';
import { AgentFleetTable } from './components/AgentFleetTable';
import { ExperimentViewer } from './components/ExperimentViewer';
import { TrustDashboard } from './components/TrustDashboard';
import { mockApi } from './services/mockApi';
import { TrustScore, TrustReceipt, Agent, Experiment, SystemMetrics } from './types';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [receipts, setReceipts] = useState<TrustReceipt[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [trustData, receiptsData, agentsData, experimentsData, metricsData] = await Promise.all([
        mockApi.getTrustScore(),
        mockApi.getTrustReceipts(10),
        mockApi.getAgentFleet(),
        mockApi.getExperiments(),
        mockApi.getSystemMetrics(),
      ]);

      setTrustScore(trustData);
      setReceipts(receiptsData);
      setAgents(agentsData);
      setExperiments(experimentsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      const data = await mockApi.getRealTimeUpdates();
      setTrustScore(data.trustScore);
      setMetrics(data.metrics);
      
      // Also refresh receipts
      const newReceipts = await mockApi.getTrustReceipts(10);
      setReceipts(newReceipts);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const navigation = [
    { id: 'dashboard', label: 'Trust Dashboard', icon: Shield },
    { id: 'principles', label: 'Trust Principles', icon: Activity },
    { id: 'receipts', label: 'Trust Receipts', icon: FileText },
    { id: 'agents', label: 'Agent Fleet', icon: Users },
    { id: 'experiments', label: 'Research Validation', icon: Eye },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <TrustDashboard trustScore={trustScore!} metrics={metrics!} onRefresh={handleRefresh} />;
      
      case 'principles':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">SYMBI Trust Physics</h2>
              <p className="text-gray-400">
                Six-Pillar Governance Scoring aligned with W3C standards and constitutional AI principles
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trustScore?.principles.map((principle) => (
                <TrustPillarCard
                  key={principle.id}
                  principle={principle}
                  onClick={() => console.log('Principle clicked:', principle)}
                />
              ))}
            </div>
          </div>
        );
      
      case 'receipts':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Cryptographic Trust Receipts</h2>
              <p className="text-gray-400">
                Immutable audit trail with SHA-256 hashing and Ed25519 signatures
              </p>
            </div>
            <ReceiptChain receipts={receipts} />
          </div>
        );
      
      case 'agents':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Agent Fleet Management</h2>
              <p className="text-gray-400">
                Real-time monitoring of AI agents with W3C DID/VC identity verification
              </p>
            </div>
            <AgentFleetTable
              agents={agents}
              onAgentClick={(agent) => console.log('Agent clicked:', agent)}
            />
          </div>
        );
      
      case 'experiments':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Double-Blind Research Validation</h2>
              <p className="text-gray-400">
                Controlled experiments with statistical analysis and provable causality
              </p>
            </div>
            <ExperimentViewer
              experiments={experiments}
              onExperimentClick={(experiment) => console.log('Experiment clicked:', experiment)}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-cyan-400 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-100">SONATE Platform</h1>
                <p className="text-xs text-gray-400">Enterprise AI Governance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-subtle" />
                <span>System Operational</span>
              </div>
              <div className="text-sm font-mono text-cyan-400">
                Trust Score: {trustScore?.total || '--'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeSection === item.id
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!trustScore || !metrics ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : (
          renderContent()
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              © 2024 SONATE by Yseeku - Enterprise AI You Can Trust
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="https://yseeku.com" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Platform
              </a>
              <a href="https://gammatria.com" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Research
              </a>
              <a href="https://symbi.world" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Community
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;