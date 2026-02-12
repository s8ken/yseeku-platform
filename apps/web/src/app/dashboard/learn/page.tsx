'use client';

import dynamic from 'next/dynamic';

// Dynamic import with ssr:false avoids Radix UI component prerender failures
const LearnPageClient = dynamic(() => import('./LearnPageClient'), { ssr: false });

export default function LearnPage() {
    return <LearnPageClient />;
}
