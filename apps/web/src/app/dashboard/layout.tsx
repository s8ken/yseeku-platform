import DashboardLayoutClient from './DashboardLayoutClient';

// Force dynamic rendering for all dashboard routes to avoid Radix UI
// component failures during Next.js static page generation (SSG).
// Dashboard routes are auth-gated so static prerendering has no benefit.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
