import { apiClient } from '@quiz/api-client';

export function Footer() {
    return (
        <footer className="border-t bg-muted/30">
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0 px-4 mx-auto">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built by{" "}
                        <a
                            href="https://realtutorialhub.com"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium underline underline-offset-4 decoration-primary text-primary"
                        >
                            RealTutorialHub
                        </a>
                        . The source code is available on{" "}
                        <a
                            href="#"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium underline underline-offset-4"
                        >
                            GitHub
                        </a>
                        .
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    <a
                        href={apiClient.getAdminUrl()}
                        className="text-xs font-bold text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest"
                    >
                        Governance
                    </a>
                    <span className="text-sm text-muted-foreground">© 2026 Quiz Platform</span>
                </div>
            </div>
        </footer>
    );
}
