'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Agent } from '@/lib/api';

interface AgentEditModalProps {
  agent: Agent;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
}

export function AgentEditModal({ agent, open, onClose, onUpdate }: AgentEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 1000,
    isPublic: false,
    ciModel: 'none',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        description: agent.type || '',
        systemPrompt: '', // Note: systemPrompt not available in current Agent interface
        temperature: 0.7,
        maxTokens: 1000,
        isPublic: false,
        ciModel: 'none',
      });
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdate(agent.id, formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>
            Update agent configuration and parameters
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Agent Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Customer Support Agent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the agent's purpose and capabilities"
                rows={3}
                required
              />
            </div>
          </div>

          {/* LLM Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">LLM Configuration</h3>

            <div className="space-y-2">
              <Label htmlFor="edit-systemPrompt">System Prompt</Label>
              <Textarea
                id="edit-systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="You are a helpful AI assistant..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-temperature">
                  Temperature: {formData.temperature.toFixed(1)}
                </Label>
                <Slider
                  id="edit-temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[formData.temperature]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, temperature: value[0] })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Higher values make output more random
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-maxTokens">Max Tokens</Label>
                <Input
                  id="edit-maxTokens"
                  type="number"
                  min={100}
                  max={32000}
                  value={formData.maxTokens}
                  onChange={(e) =>
                    setFormData({ ...formData, maxTokens: parseInt(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum response length
                </p>
              </div>
            </div>
          </div>

          {/* Trust Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Trust & Governance</h3>

            <div className="space-y-2">
              <Label htmlFor="edit-ciModel">Constitutional AI Model</Label>
              <Select
                value={formData.ciModel}
                onValueChange={(value) => setFormData({ ...formData, ciModel: value })}
              >
                <SelectTrigger id="edit-ciModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="SONATE-core">SONATE Core</SelectItem>
                  <SelectItem value="overseer">Overseer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Apply constitutional AI principles for ethical alignment
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-isPublic">Public Agent</Label>
                <p className="text-xs text-muted-foreground">
                  Make this agent accessible to other users
                </p>
              </div>
              <Switch
                id="edit-isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked })
                }
              />
            </div>
          </div>

          {/* Agent Stats (Read-only) */}
          {agent && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm">Agent Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Trust Score</Label>
                  <p className="text-lg font-medium">
                    {agent.trustScore !== undefined ? agent.trustScore.toFixed(1) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Interactions</Label>
                  <p className="text-lg font-medium">{agent.interactionCount || 0}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="text-lg font-medium capitalize">{agent.status || 'Unknown'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Agent'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
