'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  /** Optional label shown in the error card, e.g. "KPI metrics" */
  label?: string;
  /** Render a compact inline error instead of a full card */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Surface to console so it shows up in error monitoring
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.label ?? 'this section';

    if (this.props.inline) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 p-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Failed to load {label}.</span>
          <button
            onClick={this.handleReset}
            className="underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <Card className="border-amber-200 dark:border-amber-800">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <div>
            <p className="font-medium">Failed to load {label}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {this.state.error?.message ?? 'An unexpected error occurred'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            <RefreshCw className="h-3 w-3 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
}
