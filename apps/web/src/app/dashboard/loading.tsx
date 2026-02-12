import { KPICardSkeleton, DriftWidgetSkeleton, EmergenceWidgetSkeleton, PhaseShiftWidgetSkeleton } from '@/components/dashboard-skeletons';

export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-72 bg-muted rounded animate-pulse" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DriftWidgetSkeleton />
                <EmergenceWidgetSkeleton />
                <PhaseShiftWidgetSkeleton />
            </div>
        </div>
    );
}
