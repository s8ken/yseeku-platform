
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[500px] p-6">
      <Card className="w-full max-w-md border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Dashboard Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Something went wrong while loading the dashboard.
          </p>
          <div className="p-4 rounded-md bg-slate-100 dark:bg-slate-900 text-xs font-mono break-all text-red-500">
            {error.message || 'Unknown error occurred'}
          </div>
          <Button onClick={() => reset()} className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
