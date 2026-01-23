import { FileText, MoreHorizontal, ExternalLink } from 'lucide-react';

const MOCK_CONTENT = [
    { id: '1', name: 'Frontend React Hooks', domain: 'Full Stack', questions: 45, status: 'Published' },
    { id: '2', name: 'Redis Caching', domain: 'Backend', questions: 32, status: 'Review' },
    { id: '3', name: 'K8s Networking', domain: 'DevOps', questions: 18, status: 'Published' },
    { id: '4', name: 'Metasploit Basics', domain: 'Ethical Hacking', questions: 24, status: 'Draft' },
];

export function ContentManager() {
    return (
        <div className="rounded-[3rem] border bg-background overflow-hidden shadow-sm">
            <div className="p-8 border-b flex items-center justify-between bg-muted/5">
                <h3 className="text-xl font-black tracking-tight">Recent Content Modules</h3>
                <button className="text-xs font-bold text-primary hover:underline">View All Repository</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-muted/10">
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Module Name</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Domain</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Questions</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {MOCK_CONTENT.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/5 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                            <FileText size={18} />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-sm font-semibold">{item.domain}</td>
                                <td className="px-8 py-6 text-sm font-bold text-muted-foreground">{item.questions}</td>
                                <td className="px-8 py-6">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'Published' ? 'bg-green-500/10 text-green-500' :
                                            item.status === 'Review' ? 'bg-orange-500/10 text-orange-500' : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                                            <ExternalLink size={16} />
                                        </button>
                                        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
