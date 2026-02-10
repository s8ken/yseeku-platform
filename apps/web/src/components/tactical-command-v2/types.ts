export type TacticalAlert = {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  status?: string;
  details?: Record<string, unknown>;
};

export type TrendHistory = {
  timestamp: string;
  value: number;
}[];

export type TacticalAlerts = {
  alerts: TacticalAlert[];
  summary: {
    critical: number;
    error: number;
    warning: number;
    info: number;
    active: number;
  };
};

export type AlertsManagementResponse = {
  success: boolean;
  data: {
    alerts: TacticalAlert[];
    total: number;
    summary?: {
      critical?: number;
      error?: number;
      warning?: number;
      info?: number;
      active?: number;
    };
  };
};

export type DemoAlertsResponse = {
  tenant: string;
  summary?: {
    critical?: number;
    error?: number;
    warning?: number;
    info?: number;
    active?: number;
  };
  alerts?: TacticalAlert[];
};

export type TacticalAgent = {
  id?: string;
  _id?: string;
  name: string;
  trustScore?: number;
  lastInteraction?: string;
  lastActive?: string;
};

export type TacticalAgentsResponse = {
  success: boolean;
  data: {
    agents: TacticalAgent[];
    summary?: { total: number; active: number; inactive: number; avgTrustScore: number };
  };
};

export type DemoAgentsResponse = {
  success: boolean;
  data: Array<{ _id: string; name: string; description?: string; lastActive?: string; traits?: Record<string, any> }>;
};

