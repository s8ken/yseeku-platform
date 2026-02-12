import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function BrainLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-40 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-9 w-32 bg-muted rounded animate-pulse" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-4">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="h-10 bg-muted rounded animate-pulse" />

            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-32 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
