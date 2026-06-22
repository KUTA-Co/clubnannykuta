import { useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { X, Download, Share } from 'lucide-react';

export function InstallPrompt() {
  const { canShow, isIOS, promptInstall, dismiss } = useInstallPrompt();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);

  if (!canShow || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      toast({
        title: 'Download Started',
        description: 'Club Nanny is being added to this device.',
      });
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-xl shadow-lg border border-sage/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-sage/10 rounded-lg flex items-center justify-center">
            <img
              src="/icon-192.png"
              alt="Club Nanny"
              className="w-8 h-8 rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-primary">
              Install Club Nanny
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? 'Add to your home screen for quick access'
                : 'Install our app for a better experience'}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Share className="w-4 h-4" />
              Tap <span className="font-medium">Share</span> then{' '}
              <span className="font-medium">"Add to Home Screen"</span>
            </p>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="flex-1"
            >
              Not now
            </Button>
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1 gap-1.5"
            >
              <Download className="w-4 h-4" />
              Install
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
