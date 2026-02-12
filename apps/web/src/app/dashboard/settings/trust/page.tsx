'use client';

import dynamic from 'next/dynamic';

// Dynamic import with ssr:false avoids Radix UI component prerender failures  
const TrustSettingsClient = dynamic(() => import('./TrustSettingsClient'), { ssr: false });

export default function TrustSettingsPage() {
    return <TrustSettingsClient />;
}
