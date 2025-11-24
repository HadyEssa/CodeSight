import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Network, Brain, Lock, FileCode, GitBranch, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
    {
        title: "Interactive Architecture Maps",
        description: "Automatically generate visual diagrams of your entire codebase. Zoom, pan, and click to explore dependencies.",
        icon: Network,
        className: "md:col-span-2 md:row-span-2",
    },
    {
        title: "AI-Powered Explanations",
        description: "Select any file or component to get a plain-english explanation of what it does.",
        icon: Brain,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Privacy First",
        description: "Your code never leaves your browser/server loop. We use your personal API key.",
        icon: Lock,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Smart Refactoring",
        description: "Ask 'how do I add X?' and see exactly which files need to change.",
        icon: GitBranch,
        className: "md:col-span-2 md:row-span-1",
    },
    {
        title: "Instant Onboarding",
        description: "Save weeks of ramp-up time. New devs can understand the system in minutes.",
        icon: Zap,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "Universal Support",
        description: "Works with TypeScript, Python, Go, Rust, and more.",
        icon: FileCode,
        className: "md:col-span-1 md:row-span-1",
    },
];

function FeatureCard({ feature }: { feature: typeof features[0] }) {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;

        const rect = divRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsFocused(true)}
            onMouseLeave={() => setIsFocused(false)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
                "relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-8 backdrop-blur-md transition-colors hover:bg-white/5",
                feature.className
            )}
        >
            {/* Spotlight Effect */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    opacity: isFocused ? 1 : 0,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
                }}
            />

            <div className="relative z-10 h-full flex flex-col">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-muted-foreground flex-1">{feature.description}</p>
            </div>
        </motion.div>
    );
}

export function Features() {
    return (
        <section className="py-32 relative">
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Everything you need to <br />
                        <span className="text-gradient">master your code</span>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        CodeSight bridges the gap between reading code and understanding architecture.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(200px,auto)]">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} />
                    ))}
                </div>
            </div>
        </section>
    );
}
