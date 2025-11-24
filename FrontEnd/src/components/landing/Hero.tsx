import { motion } from "framer-motion";
import { ArrowRight, Github, Zap, Code2, Layers, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
                <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>
            </div>

            <div className="container px-4 mx-auto relative z-10">
                <div className="flex flex-col items-center text-center">

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium mb-8 text-blue-200 shadow-lg shadow-blue-500/10"
                    >
                        <Zap className="w-4 h-4 fill-blue-400 text-blue-400" />
                        <span>v1.0 Public Beta is Live</span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-6xl md:text-8xl font-bold tracking-tight mb-8"
                    >
                        Visualize Your Code <br />
                        <span className="text-gradient">Like Never Before.</span>
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
                    >
                        Turn any GitHub repo or ZIP into an interactive <span className="text-white font-semibold">architectural map</span>.
                        Understand complex features, refactor with confidence, and onboard developers 10x faster.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                    >
                        <Button
                            size="lg"
                            className="h-14 px-8 text-lg gap-2 rounded-full bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10 transition-all hover:scale-105"
                            onClick={() => {
                                document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Start Visualizing <ArrowRight className="w-5 h-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-8 text-lg gap-2 rounded-full border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105"
                            onClick={() => window.open('https://github.com/HadyEssa/CodeSight', '_blank')}
                        >
                            <Github className="w-5 h-5" />
                            Star on GitHub
                        </Button>
                    </motion.div>

                    {/* Floating Preview Elements */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative w-full max-w-5xl mx-auto"
                    >
                        {/* Main Glass Card */}
                        <div className="glass rounded-2xl p-2 aspect-video overflow-hidden relative group">
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Mock UI Content */}
                            <div className="w-full h-full bg-[#0A0A0B] rounded-xl border border-white/5 flex overflow-hidden">
                                {/* Sidebar */}
                                <div className="w-64 border-r border-white/5 p-4 hidden md:block">
                                    <div className="flex items-center gap-2 mb-6 text-white/80">
                                        <Layers className="w-5 h-5" />
                                        <span className="font-semibold">Architecture</span>
                                    </div>
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-8 rounded bg-white/5 w-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                        ))}
                                    </div>
                                </div>
                                {/* Main Area */}
                                <div className="flex-1 p-6 relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                                            <Cpu className="w-24 h-24 text-blue-400 relative z-10 animate-float" />
                                        </div>
                                    </div>
                                    {/* Connecting Lines Mockup */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                                        <path d="M100,100 Q200,50 300,100 T500,100" fill="none" stroke="white" strokeWidth="2" />
                                        <path d="M100,300 Q200,350 300,300 T500,300" fill="none" stroke="white" strokeWidth="2" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badges */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-10 -left-10 glass px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-green-400"
                        >
                            <Code2 className="w-4 h-4" /> TypeScript Ready
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-5 -right-5 glass px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-purple-400"
                        >
                            <Cpu className="w-4 h-4" /> AI Powered
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
