import { ApiKeyModal } from "@/components/settings/ApiKeyModal";
import { Hero } from "@/components/landing/Hero";
import { ProjectUploader } from "@/components/upload/ProjectUploader";
import { Features } from "@/components/landing/Features";
import { Toaster } from "@/components/ui/sonner";
import { ArchitecturePage } from "@/pages/ArchitecturePage";
import { AuthCallback } from "@/pages/AuthCallback";
import { Routes, Route } from "react-router-dom";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserProfile } from "@/components/auth/UserProfile";
import { useAppStore } from "@/store/useAppStore";

function LandingPage() {
  const { user } = useAppStore();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <ApiKeyModal />

      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="font-bold text-xl">CodeSight</div>
        <div>
          {user ? <UserProfile /> : <LoginButton />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-24 pb-24">
        <Hero />
        <div id="upload-section">
          <ProjectUploader />
        </div>
        <Features />
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-muted-foreground">
        <p>© 2025 CodeSight. Built for developers.</p>
      </footer>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/architecture" element={<ArchitecturePage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}

export default App;
