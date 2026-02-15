import { DocsViewer } from '@/components/docs/DocsViewer';
import { getDocsStructure } from '@/lib/docs-loader';


export default async function GovernancePage() {
    const structure = await getDocsStructure();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black tracking-tighter text-[#1A1A1A] uppercase">
                    System <span className="text-[#FF4B91]">Governance</span>
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Source of Truth: Version Controlled Documentation Policy
                </p>
            </div>

            <DocsViewer structure={structure} />
        </div>
    );
}
