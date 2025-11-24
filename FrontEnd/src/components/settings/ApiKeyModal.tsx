import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Key, ExternalLink, ShieldCheck } from "lucide-react";

export function ApiKeyModal() {
    const { apiKey, setApiKey } = useAppStore();
    const [userOpen, setUserOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    // Derived state: Open if no key, OR if user explicitly opened it (e.g. via settings, though not implemented yet)
    // Actually, if no key, we FORCE open. If key exists, we respect userOpen.
    // But wait, if key exists, userOpen is initially false.
    // If key is removed, !apiKey becomes true, so it opens.
    const isOpen = !apiKey || userOpen;

    const handleSave = () => {
        if (inputValue.trim().startsWith("AIza")) {
            setApiKey(inputValue.trim());
            setUserOpen(false);
        } else {
            // Simple client-side validation (can be improved)
            alert("That doesn't look like a valid Gemini API key. It usually starts with 'AIza'.");
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                // Only allow closing if we have an API key
                if (apiKey) {
                    setUserOpen(open);
                }
            }}
        >
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => !apiKey && e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Key className="w-5 h-5 text-primary" />
                        Setup Your Intelligence
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        CodeSight is <strong>100% Free & Open Source</strong>. We don't charge you for AI.
                        <br />
                        Simply bring your own Gemini API Key to get started.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="apiKey">Gemini API Key</Label>
                        <Input
                            id="apiKey"
                            placeholder="AIzaSy..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            type="password"
                            className="font-mono"
                        />
                    </div>

                    <div className="bg-muted/50 p-3 rounded-md text-sm flex gap-3 items-start">
                        <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">
                            Your key is stored locally in your browser. It is never sent to our servers, only directly to Google's API when you analyze code.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:justify-between sm:flex-row gap-3">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                        >
                            Get Free Key <ExternalLink className="w-4 h-4" />
                        </a>
                    </Button>
                    <Button onClick={handleSave} disabled={!inputValue} className="w-full sm:w-auto">
                        Save & Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
