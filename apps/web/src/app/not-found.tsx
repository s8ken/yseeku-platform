import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 mb-6 shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-muted-foreground">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/demo"
            className="inline-block rounded-lg border border-border px-6 py-3 text-foreground hover:bg-muted transition-colors"
          >
            Try Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
