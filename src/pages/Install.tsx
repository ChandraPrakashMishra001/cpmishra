import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <img 
            src="/lia-icon-192.png" 
            alt="Lia" 
            className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
          />
        </div>

        <h1 className="text-2xl font-bold text-pink-600 mb-2">
          Install Lia ✨
        </h1>
        <p className="text-gray-600 mb-6">
          Add Lia to your home screen for quick access anytime!
        </p>

        {isInstalled ? (
          <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 px-4 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">App installed!</span>
          </div>
        ) : isIOS ? (
          <div className="space-y-4">
            <div className="bg-pink-50 rounded-xl p-4 text-left">
              <p className="font-medium text-pink-700 mb-3 flex items-center gap-2">
                <Share className="w-5 h-5" />
                How to install on iPhone:
              </p>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Tap the <strong>Share</strong> button in Safari</li>
                <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>3. Tap <strong>"Add"</strong> to confirm</li>
              </ol>
            </div>
          </div>
        ) : deferredPrompt ? (
          <Button 
            onClick={handleInstall}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white py-6 rounded-xl text-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Install App
          </Button>
        ) : (
          <div className="bg-pink-50 rounded-xl p-4 text-left">
            <p className="font-medium text-pink-700 mb-3">
              How to install:
            </p>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. Open browser menu (⋮)</li>
              <li>2. Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
            </ol>
          </div>
        )}

        <a 
          href="/" 
          className="inline-block mt-6 text-pink-500 hover:text-pink-600 font-medium"
        >
          ← Back to Lia
        </a>
      </div>
    </div>
  );
}
