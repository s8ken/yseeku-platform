import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ReceiptsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <div className="h-8 w-44 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-80 bg-muted rounded animate-pulse" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-4">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-20 bg-muted rounded animate-pulse mt-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                                <div>
                                    <div className="h-5 w-40 bg-muted rounded animate-pulse mb-1" />
                                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
                            <div className="h-16 w-full bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
