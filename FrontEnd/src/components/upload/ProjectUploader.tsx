import { useState, useRef } from "react";
import axios from "axios";
import { Upload, FileArchive, X, Loader2, ArrowRight, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { RepoSelector } from "./RepoSelector";

export function ProjectUploader() {
    const navigate = useNavigate();
    const { setAnalysisData, user } = useAppStore();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [gitUrl, setGitUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            if (droppedFile.name.endsWith(".zip")) {
                setFile(droppedFile);
                setGitUrl("");
            } else {
                toast.error("Please upload a ZIP file");
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setGitUrl("");
        }
    };

    const handleUpload = async () => {
        if (!file && !gitUrl) return;

        setUploading(true);
        setProgress(0);

        // Simulate progress for UX (real upload progress can be added to axios config)
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return 90;
                return prev + 5;
            });
        }, 100);

        try {
            let response;

            if (gitUrl) {
                // Handle Git URL upload
                response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload/git`, { gitUrl }, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true // Send session cookies for auth
                });
            } else if (file) {
                // Handle File upload
                const formData = new FormData();
                formData.append("file", file);

                response = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            } else {
                return;
            }

            clearInterval(interval);
            setProgress(100);

            if (response.data.projectId) {
                const projectId = response.data.projectId;
                toast.success("Project uploaded! Analyzing...");

                // Trigger Analysis
                try {
                    const analyzeResponse = await axios.post(`${import.meta.env.VITE_API_URL}/api/analyze`, { projectId });

                    setAnalysisData(analyzeResponse.data);
                    toast.success("Analysis Complete! Redirecting...");

                    // Navigate to architecture page
                    setTimeout(() => {
                        navigate("/architecture");
                    }, 1000);

                } catch (analyzeError: any) {
                    console.error("Analysis failed:", analyzeError);
                    const errorMessage = analyzeError.response?.data?.details || analyzeError.message || "Analysis failed";
                    toast.error(`Analysis Failed: ${errorMessage}`);
                }
            }
        } catch (error: any) {
            clearInterval(interval);
            setProgress(0);
            console.error("Upload error:", error);
            const errorMessage = error.response?.data?.error || error.response?.data?.details || "Upload failed. Please try again.";
            toast.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto relative group">
            {/* Glowing Background Blur */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-1000"></div>

            <div className="relative glass rounded-2xl p-8 md:p-12">
                <div className="text-center mb-10">
                    <h3 className="text-3xl font-bold mb-3">Import Your Codebase</h3>
                    <p className="text-muted-foreground text-lg">
                        Upload a ZIP file or paste a Git repository URL to begin analysis.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Drag & Drop Zone */}
                    <motion.div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        animate={{
                            scale: isDragging ? 1.02 : 1,
                            borderColor: isDragging ? "rgba(59, 130, 246, 0.5)" : "rgba(255, 255, 255, 0.1)"
                        }}
                        className={cn(
                            "relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 bg-black/20 hover:bg-black/40",
                            file ? "border-blue-500/50 bg-blue-500/5" : ""
                        )}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".zip"
                            onChange={handleFileSelect}
                        />

                        <AnimatePresence mode="wait">
                            {file ? (
                                <motion.div
                                    key="file"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                                        <FileArchive className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <p className="text-xl font-medium text-white mb-1">{file.name}</p>
                                    <p className="text-sm text-muted-foreground mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                    >
                                        <X className="w-4 h-4 mr-2" /> Remove File
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300",
                                        isDragging ? "bg-blue-500/20" : "bg-white/5"
                                    )}>
                                        <Upload className={cn("w-10 h-10 transition-colors", isDragging ? "text-blue-400" : "text-muted-foreground")} />
                                    </div>
                                    <p className="text-xl font-medium mb-2 text-white">Drag & drop your ZIP file here</p>
                                    <p className="text-sm text-muted-foreground">or click to browse files</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0A0A0B] px-4 text-muted-foreground font-medium tracking-wider">Or import from Git</span>
                        </div>
                    </div>

                    {/* Git URL Input & Actions */}
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <FolderGit2 className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground z-10" />
                                <Input
                                    placeholder="https://github.com/username/repo"
                                    className="pl-12 h-12 bg-black/40 border-white/10 focus:border-blue-500/50 text-lg relative z-10"
                                    value={gitUrl}
                                    onChange={(e) => {
                                        setGitUrl(e.target.value);
                                        if (e.target.value) setFile(null);
                                    }}
                                />
                            </div>

                            {/* Repo Selector for Logged-in Users */}
                            {user && (
                                <RepoSelector onSelect={(url) => {
                                    setGitUrl(url);
                                    setFile(null);
                                }} />
                            )}
                        </div>

                        {/* Start Visualizing Button - Now connected to input */}
                        <Button
                            className={cn(
                                "w-full h-14 text-lg font-medium transition-all",
                                (file || gitUrl)
                                    ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-blue-500/10 hover:scale-[1.02]"
                                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                            )}
                            onClick={handleUpload}
                            disabled={(!file && !gitUrl) || uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                                </>
                            ) : (
                                <>
                                    Start Visualizing <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Progress Bar */}
                    {uploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium text-blue-400">
                                <span>Analyzing Project Structure...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-white/5" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
