/**
 * Conversational Phase-Shift Velocity Metrics
 * 
 * Dynamic behavioral tracking that transforms Resonate from a static snapshot tool
 * into a dynamic behavioral seismograph for enterprise safety and compliance.
 * 
 * Integrated into SONATE Lab for double-blind experimentation and validation.
 */

export interface ConversationTurn {
  turnNumber: number;
  timestamp: number;
  speaker: 'user' | 'ai';   // Speaker identifier
  resonance: number;        // Resonance score (0-10)
  canvas: number;           // Canvas/mutuality score (0-10)
  identityVector: string[]; // Entity's self-description vector
  content: string;          // Turn content for audit trail
}

export interface PhaseShiftMetrics {
  deltaResonance: number;        // ΔR: Resonance change
  deltaCanvas: number;          // ΔC: Canvas change
  phaseShiftVelocity: number;   // ΔΦ/t: √(ΔR² + ΔC²) ÷ Δt
  identityStability: number;    // IS: Cosine distance between identity vectors
  alertLevel: 'none' | 'yellow' | 'red';
  transitionEvent?: TransitionEvent;
  intraConversationVelocity?: IntraConversationVelocity; // New: single-turn velocity
}

export interface IntraConversationVelocity {
  deltaResonance: number;       // Single-turn resonance change
  deltaCanvas: number;          // Single-turn canvas change
  velocity: number;             // √(ΔR² + ΔC²) per turn
  severity: 'minor' | 'moderate' | 'critical' | 'extreme';
  previousTurnNumber: number;
  currentTurnNumber: number;
}

export interface TransitionEvent {
  turnNumber: number;
  timestamp: number;
  type: 'resonance_drop' | 'canvas_rupture' | 'identity_shift' | 'combined_phase_shift';
  magnitude: number;
  excerpt: string;
  severity: 'minor' | 'moderate' | 'critical';
}

export interface ConversationalMetricsConfig {
  yellowThreshold?: number;     // Default: 2.0 (v2.3)
  redThreshold?: number;        // Default: 3.5
  phaseCriticalThreshold?: number; // v2.4: 5.5
  identityYellowThreshold?: number; // v2.3: 0.85
  identityRedThreshold?: number;    // v2.3: 0.75
  identityCriticalThreshold?: number; // v2.3: 0.65
  identityStabilityThreshold?: number; // legacy alias
  windowSize?: number;          // Default: 3 turns
  intraYellowThreshold?: number;  // v2.3: 2.0
  intraRedThreshold?: number;     // v2.3: 3.2
  intraCriticalThreshold?: number; // v2.4: 4.5
}

export class ConversationalMetrics {
  private turns: ConversationTurn[] = [];
  private transitionLog: TransitionEvent[] = [];
  private config: Required<ConversationalMetricsConfig>;

  constructor(config: ConversationalMetricsConfig = {}) {
    this.config = {
      yellowThreshold: 2.0,
      redThreshold: 3.5,
      phaseCriticalThreshold: 5.5,
      identityYellowThreshold: 0.85,
      identityRedThreshold: 0.75,
      identityCriticalThreshold: 0.65,
      identityStabilityThreshold: 0.65,
      windowSize: 3,
      intraYellowThreshold: 2.0,
      intraRedThreshold: 3.2,
      intraCriticalThreshold: 4.5,
      ...config
    };
  }

  /**
   * Record a new conversation turn and calculate phase-shift metrics
   */
  recordTurn(turn: ConversationTurn): PhaseShiftMetrics {
    this.turns.push(turn);
    
    // Keep only the configured window size
    if (this.turns.length > this.config.windowSize) {
      this.turns.shift();
    }

    // Calculate metrics if we have at least 2 turns
    if (this.turns.length < 2) {
      return {
        deltaResonance: 0,
        deltaCanvas: 0,
        phaseShiftVelocity: 0,
        identityStability: 1.0,
        alertLevel: 'none'
      };
    }

    const metrics = this.calculatePhaseShiftMetrics();
    
    // Calculate intra-conversation velocity (single-turn changes)
    const intraVelocity = this.calculateIntraConversationVelocity();
    metrics.intraConversationVelocity = intraVelocity;
    
    // Determine alert level based on both window-based and intra-conversation metrics
    metrics.alertLevel = this.determineAlertLevel(metrics, intraVelocity);
    
    // Check for transition events and log them
    if (metrics.alertLevel !== 'none') {
      this.logTransitionEvent(turn, metrics);
    }

    return metrics;
  }

  /**
   * Calculate phase-shift velocity and related metrics
   * Formula: ΔΦ/t = √(ΔR² + ΔC²) ÷ Δt
   */
  private calculatePhaseShiftMetrics(): PhaseShiftMetrics {
    const current = this.turns[this.turns.length - 1];
    const previous = this.turns[this.turns.length - 2];
    
    // Calculate deltas
    const deltaResonance = current.resonance - previous.resonance;
    const deltaCanvas = current.canvas - previous.canvas;
    
    // Calculate time delta (in turns - can be converted to actual time if needed)
    const deltaTurns = current.turnNumber - previous.turnNumber;
    const deltaTime = deltaTurns || 1; // Avoid division by zero
    
    // Calculate phase-shift velocity
    const phaseShiftVelocity = Math.sqrt(deltaResonance ** 2 + deltaCanvas ** 2) / deltaTime;
    
    // Calculate identity stability using cosine similarity
    const identityStability = this.calculateCosineSimilarity(
      previous.identityVector,
      current.identityVector
    );

    // Determine alert level
    const alertLevel = this.determineAlertLevel({
      deltaResonance,
      deltaCanvas,
      phaseShiftVelocity,
      identityStability,
      alertLevel: 'none' // Will be determined by the method
    });

    return {
      deltaResonance,
      deltaCanvas,
      phaseShiftVelocity,
      identityStability,
      alertLevel
    };
  }

  /**
   * Calculate intra-conversation velocity (single-turn changes)
   * This catches dramatic behavioral shifts even when overall scores remain "safe"
   * Formula: √(ΔR² + ΔC²) per turn
   */
  private calculateIntraConversationVelocity(): IntraConversationVelocity | undefined {
    if (this.turns.length < 2) return undefined;
    
    const current = this.turns[this.turns.length - 1];
    const previous = this.turns[this.turns.length - 2];
    
    // Calculate single-turn changes
    const deltaResonance = current.resonance - previous.resonance;
    const deltaCanvas = current.canvas - previous.canvas;
    
    // Calculate intra-conversation velocity (magnitude of change per turn)
    const velocity = Math.sqrt(deltaResonance ** 2 + deltaCanvas ** 2);
    
    // Determine severity based on velocity thresholds
    let severity: 'minor' | 'moderate' | 'critical' | 'extreme';
    if (velocity >= this.config.intraCriticalThreshold) {
      severity = 'extreme';
    } else if (velocity >= this.config.intraRedThreshold) {
      severity = 'critical';
    } else if (velocity >= this.config.intraYellowThreshold) {
      severity = 'moderate';
    } else {
      severity = 'minor';
    }
    
    return {
      deltaResonance,
      deltaCanvas,
      velocity,
      severity,
      previousTurnNumber: previous.turnNumber,
      currentTurnNumber: current.turnNumber
    };
  }

  /**
   * Calculate cosine similarity between identity vectors
   * Returns similarity score (1.0 = identical, 0.0 = orthogonal, -1.0 = opposite)
   */
  private calculateCosineSimilarity(vectorA: string[], vectorB: string[]): number {
    if (vectorA.length === 0 || vectorB.length === 0) {
      return vectorA.length === vectorB.length ? 1.0 : 0.0;
    }

    // Convert to frequency maps for comparison
    const freqA = this.vectorToFrequency(vectorA);
    const freqB = this.vectorToFrequency(vectorB);
    
    // Get all unique terms
    const allTerms = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
    
    // Calculate dot product and magnitudes
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (const term of allTerms) {
      const countA = freqA[term] || 0;
      const countB = freqB[term] || 0;
      
      dotProduct += countA * countB;
      magnitudeA += countA ** 2;
      magnitudeB += countB ** 2;
    }
    
    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    return magnitude === 0 ? 0.0 : dotProduct / magnitude;
  }

  /**
   * Convert vector to frequency map
   */
  private vectorToFrequency(vector: string[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    for (const term of vector) {
      frequency[term] = (frequency[term] || 0) + 1;
    }
    return frequency;
  }

  /**
   * Determine alert level based on thresholds (enhanced for intra-conversation velocity)
   */
  private determineAlertLevel(metrics: PhaseShiftMetrics, intraVelocity?: IntraConversationVelocity): 'none' | 'yellow' | 'red' {
    // Identity stability bands (v2.3)
    if (metrics.identityStability <= this.config.identityCriticalThreshold) {
      return 'red'
    } else if (metrics.identityStability <= this.config.identityRedThreshold) {
      return 'red'
    } else if (metrics.identityStability <= this.config.identityYellowThreshold) {
      return 'yellow'
    }
    
    // Check window-based phase-shift velocity
    if (metrics.phaseShiftVelocity >= this.config.redThreshold) {
      return 'red';
    } else if (metrics.phaseShiftVelocity >= this.config.yellowThreshold) {
      return 'yellow';
    }
    
    // Check intra-conversation velocity (catches sudden shifts even in "safe" conversations)
    if (intraVelocity) {
      if (intraVelocity.velocity >= this.config.intraCriticalThreshold) {
        return 'red'
      } else if (intraVelocity.velocity >= this.config.intraRedThreshold) {
        return 'red'
      } else if (intraVelocity.velocity >= this.config.intraYellowThreshold) {
        return 'yellow'
      }
    }
    
    return 'none';
  }

  /**
   * Log transition events for audit trail
   */
  private logTransitionEvent(turn: ConversationTurn, metrics: PhaseShiftMetrics): void {
    const event: TransitionEvent = {
      turnNumber: turn.turnNumber,
      timestamp: turn.timestamp,
      type: this.determineTransitionType(metrics),
      magnitude: metrics.phaseShiftVelocity,
      excerpt: this.generateExcerpt(turn.content),
      severity: this.determineSeverity(metrics)
    };
    
    this.transitionLog.push(event);
    
    // Add transition event to metrics
    metrics.transitionEvent = event;
  }

  /**
   * Determine the type of transition event
   */
  private determineTransitionType(metrics: PhaseShiftMetrics): TransitionEvent['type'] {
    const { deltaResonance, deltaCanvas, identityStability } = metrics;
    
    if (identityStability <= this.config.identityRedThreshold) {
      return 'identity_shift';
    } else if (Math.abs(deltaResonance) > 2.0 && Math.abs(deltaCanvas) > 1.5) {
      return 'combined_phase_shift';
    } else if (deltaResonance < -2.0) {
      return 'resonance_drop';
    } else if (Math.abs(deltaCanvas) > 2.0) {
      return 'canvas_rupture';
    }
    
    return 'combined_phase_shift';
  }

  /**
   * Generate excerpt for audit trail
   */
  private generateExcerpt(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Determine severity level
   */
  private determineSeverity(metrics: PhaseShiftMetrics): TransitionEvent['severity'] {
    const { phaseShiftVelocity, identityStability } = metrics;
    
    if (identityStability <= this.config.identityCriticalThreshold || phaseShiftVelocity >= this.config.phaseCriticalThreshold) {
      return 'critical';
    } else if (phaseShiftVelocity >= this.config.yellowThreshold || identityStability <= this.config.identityYellowThreshold) {
      return 'moderate';
    }
    
    return 'minor';
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    currentTurn: ConversationTurn | null;
    phaseShiftVelocity: number;
    identityStability: number;
    alertLevel: 'none' | 'yellow' | 'red';
    transitionCount: number;
    recentTransitions: TransitionEvent[];
  } {
    const current = this.turns[this.turns.length - 1] || null;
    const recentMetrics = this.turns.length >= 2 
      ? this.calculatePhaseShiftMetrics()
      : {
          deltaResonance: 0,
          deltaCanvas: 0,
          phaseShiftVelocity: 0,
          identityStability: 1.0,
          alertLevel: 'none' as const
        };

    return {
      currentTurn: current,
      phaseShiftVelocity: recentMetrics.phaseShiftVelocity,
      identityStability: recentMetrics.identityStability,
      alertLevel: recentMetrics.alertLevel,
      transitionCount: this.transitionLog.length,
      recentTransitions: this.transitionLog.slice(-5) // Last 5 transitions
    };
  }

  /**
   * Get complete transition log
   */
  getTransitionLog(): TransitionEvent[] {
    return [...this.transitionLog];
  }

  /**
   * Clear metrics history
   */
  clear(): void {
    this.turns = [];
    this.transitionLog = [];
  }

  /**
   * Export metrics data for compliance/audit
   */
  exportAuditData(): {
    sessionId: string;
    config: Required<ConversationalMetricsConfig>;
    turns: ConversationTurn[];
    transitions: TransitionEvent[];
    summary: {
      currentTurn: ConversationTurn | null;
      phaseShiftVelocity: number;
      identityStability: number;
      alertLevel: 'none' | 'yellow' | 'red';
      transitionCount: number;
      recentTransitions: TransitionEvent[];
    };
    exportedAt: number;
  } {
    const sessionId = this.generateSessionId();
    
    return {
      sessionId,
      config: this.config,
      turns: [...this.turns],
      transitions: [...this.transitionLog],
      summary: this.getMetricsSummary(),
      exportedAt: Date.now()
    };
  }

  /**
   * Generate unique session ID for audit trail
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `session-${timestamp}-${random}`;
  }
}