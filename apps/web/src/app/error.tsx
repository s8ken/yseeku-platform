'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 mb-6 shadow-lg">
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-foreground">500</h1>
        <h2 className="mt-4 text-2xl font-semibold text-muted-foreground">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
