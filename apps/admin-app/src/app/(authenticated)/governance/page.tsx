import { PageTitle } from '@quiz/ui';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { getDocsStructure } from '@/lib/docs-loader';


export default async function GovernancePage() {
    const structure = await getDocsStructure();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <PageTitle text="System Governance" />
                <p className="text-sm text-muted-foreground font-medium">
                    Source of Truth: Version Controlled Documentation Policy
                </p>
            </div>

            <DocsViewer structure={structure} />
        </div>
    );
}
