import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Zap } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col gap-20 pb-20">
            {/* Hero Section */}
            <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 border-b">
                <div className="container px-4 mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Master Your Skills with <br /> Enterprise-Grade Quizzes
                    </h1>
                    <p className="max-w-[700px] mx-auto text-lg md:text-xl text-muted-foreground mb-10">
                        Join thousands of professionals in 6 major domains.
                        Experience adaptive difficulty and real-time analytics designed for growth.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-lg font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                        >
                            Get Started for Free
                            <ArrowRight className="ml-2" size={20} />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center rounded-lg border-2 border-primary/20 bg-background px-8 py-3.5 text-lg font-bold transition-all hover:bg-accent hover:border-primary/50"
                        >
                            Login to Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container px-4 mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-2xl border-2 border-primary/5 bg-muted/20 hover:border-primary/20 transition-all">
                        <Zap className="text-primary mb-4" size={32} />
                        <h3 className="text-xl font-bold mb-2">Adaptive Difficulty</h3>
                        <p className="text-muted-foreground">
                            Balanced questions (30% Simple, 30% Intermediate, 40% Expert) to push your limits.
                        </p>
                    </div>
                    <div className="p-8 rounded-2xl border-2 border-primary/5 bg-muted/20 hover:border-primary/20 transition-all">
                        <Shield className="text-primary mb-4" size={32} />
                        <h3 className="text-xl font-bold mb-2">Verified Domains</h3>
                        <p className="text-muted-foreground">
                            Curated assessments for Full Stack, Cyber Security, Data Science and more.
                        </p>
                    </div>
                    <div className="p-8 rounded-2xl border-2 border-primary/5 bg-muted/20 hover:border-primary/20 transition-all">
                        <CheckCircle2 className="text-primary mb-4" size={32} />
                        <h3 className="text-xl font-bold mb-2">Detailed Reports</h3>
                        <p className="text-muted-foreground">
                            Deep dive into your strengths and weaknesses with our reporting engine.
                        </p>
                    </div>
                </div>
            </section>

            {/* Domain Section */}
            <section className="bg-secondary/5 py-20 rounded-[3rem] mx-4">
                <div className="container px-4 mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Path</h2>
                    <p className="text-muted-foreground mb-12">Expertly crafted quizzes for career growth</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {["Full Stack", "Data Analyst", "Data Science", "Cyber Security", "Ethical Hacking"].map((domain) => (
                            <span key={domain} className="px-6 py-2 rounded-full border border-primary/20 bg-background font-medium hover:text-primary transition-colors cursor-default">
                                {domain}
                            </span>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
