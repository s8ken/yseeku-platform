'use client';

import dynamic from 'next/dynamic';

// Dynamic import with ssr:false avoids Radix UI component prerender failures
const BedauPageClient = dynamic(() => import('./BedauPageClient'), { ssr: false });

export default function BedauPage() {
    return <BedauPageClient />;
}
