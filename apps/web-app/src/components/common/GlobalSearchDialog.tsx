import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    LayoutDashboard,
    Home,
    Monitor,
    Moon,
    Sun,
    Laptop
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { SearchResult } from "@quiz/api-client";

export function GlobalSearchDialog() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();
    const { setTheme } = useTheme();

    // Debounce Logic
    React.useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                // Dynamic import to avoid SSR issues if needed, or just use global
                const { apiClient } = await import('@quiz/api-client');
                const data = await apiClient.search.searchGlobal(query);
                setResults(data);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === "Escape" && open) {
                e.preventDefault();
                setOpen(false);
            }
            // Enter on first result when input is focused
            if (e.key === "Enter" && open && results.length > 0 && document.activeElement?.tagName === 'INPUT') {
                e.preventDefault();
                runCommand(() => router.push(results[0].path));
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, results, router]);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div
                className="fixed left-[50%] top-[20%] translate-x-[-50%] w-full max-w-[640px] shadow-2xl rounded-xl border bg-popover text-popover-foreground overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <Command shouldFilter={false} className="w-full bg-transparent">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Command.Input
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Type a command or search..."
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                        {loading && <Command.Loading>Searching...</Command.Loading>}

                        {!loading && results.length === 0 && query.length >= 2 && (
                            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                                No results found.
                            </Command.Empty>
                        )}

                        {results.length > 0 && (
                            <Command.Group heading="Results" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                {results.map((item) => (
                                    <CommandItem key={item.id} onSelect={() => runCommand(() => router.push(item.path))}>
                                        {item.kind === 'topic' ? <Monitor className="mr-2 h-4 w-4" /> : <Calculator className="mr-2 h-4 w-4" />}
                                        <span>{item.label}</span>
                                        {item.meta && <span className="ml-auto text-xs opacity-50">{item.meta}</span>}
                                    </CommandItem>
                                ))}
                            </Command.Group>
                        )}

                        <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span className="text-foreground">Dashboard</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                                <Home className="mr-2 h-4 w-4" />
                                <span className="text-foreground">Home</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/quiz/new'))}>
                                <Calculator className="mr-2 h-4 w-4" />
                                <span className="text-foreground">New Quiz</span>
                            </CommandItem>
                        </Command.Group>

                        <Command.Group heading="Theme" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                                <Sun className="mr-2 h-4 w-4" />
                                <span className="text-foreground">Light Mode</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                                <Moon className="mr-2 h-4 w-4" />
                                <span className="text-foreground">Dark Mode</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                                <Laptop className="mr-2 h-4 w-4" />
                                <span className="text-foreground">System</span>
                            </CommandItem>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

// Wrapper for Command.Item with styling
function CommandItem({ children, onSelect }: { children: React.ReactNode, onSelect?: () => void }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
            {children}
        </Command.Item>
    )
}
