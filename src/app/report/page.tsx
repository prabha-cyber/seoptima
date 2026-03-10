import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ReportTemplateContent from './ReportTemplateContent';

export default function ReportPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <span className="ml-2 text-lg text-muted-foreground">Loading Report...</span>
            </div>
        }>
            <ReportTemplateContent />
        </Suspense>
    );
}
