import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, PlusSquare, MoreVertical, ExternalLink } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

interface DownloadAppButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  children?: React.ReactNode;
}

// Detect in-app browsers (Instagram, Facebook, TikTok, etc.) where PWA install is impossible.
function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Line\/|Twitter|TikTok|Snapchat|Pinterest|WhatsApp|MicroMessenger/i.test(ua);
}

function isAppleDesktop() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isMac = /Macintosh|Mac OS X/i.test(ua) || /Mac/i.test(platform);
  const isIPadDesktopMode = isMac && navigator.maxTouchPoints > 1;
  return isMac && !isIPadDesktopMode;
}

function isWindowsDesktop() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  return /Windows/i.test(ua) || /Win/i.test(platform);
}

function isFirefoxDesktop() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Firefox/i.test(ua) && !/FxiOS|Android/i.test(ua);
}

type InstallInstructionMode = "in-app" | "apple-mobile" | "apple-desktop" | "firefox-desktop" | "windows-desktop" | "standard";

function EdgeAppsIcon() {
  return (
    <span className="inline-grid h-5 w-5 shrink-0 grid-cols-2 gap-0.5" aria-hidden="true">
      <span className="rounded-[2px] border-2 border-[#4A4A4A]" />
      <span className="rounded-[2px] border-2 border-[#4A4A4A]" />
      <span className="rounded-[2px] border-2 border-[#4A4A4A]" />
      <span />
    </span>
  );
}

/**
 * Reusable "Download App" button. Always gives the user clear, visible feedback:
 * - Android/desktop with a native prompt available -> fires it.
 * - Otherwise -> opens an instructions modal tailored to the device
 *   (iOS Safari, Android/desktop browser menu, or an in-app-browser warning).
 */
export function DownloadAppButton({ className, variant = "outline", children }: DownloadAppButtonProps) {
  const { isIOS, promptInstall } = useInstallPrompt();
  const [instructionMode, setInstructionMode] = useState<InstallInstructionMode | null>(null);

  const inApp = isInAppBrowser();
  const appleDesktop = isAppleDesktop();
  const firefoxDesktop = isFirefoxDesktop();
  const windowsDesktop = isWindowsDesktop();

  const handleDownloadApp = async () => {
    // In-app browsers can't install at all — tell them to open in a real browser.
    if (inApp) {
      setInstructionMode("in-app");
      return;
    }

    // Apple mobile and desktop browsers use manual Add to Home Screen / Add to Dock flows.
    if (isIOS) {
      setInstructionMode("apple-mobile");
      return;
    }

    if (appleDesktop) {
      setInstructionMode("apple-desktop");
      return;
    }

    // Android and non-Apple desktop: fire the native prompt if the browser offers it,
    // otherwise fall back to the instructions modal so something always shows.
    const installed = await promptInstall();
    if (!installed) {
      setInstructionMode(firefoxDesktop ? "firefox-desktop" : windowsDesktop ? "windows-desktop" : "standard");
    }
  };

  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#8BA99E' }}>{n}</div>
      <div className="flex items-center flex-wrap gap-1.5 text-[#4A4A4A]">{children}</div>
    </div>
  );

  return (
    <>
      <Button type="button" variant={variant} className={className} onClick={handleDownloadApp}>
        <Download className="w-4 h-4 mr-2" /> {children ?? "Download App"}
      </Button>

      {instructionMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setInstructionMode(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[#4A4A4A] mb-4 text-center">Install Club Nanny</h3>

            {instructionMode === "in-app" ? (
              <>
                <p className="text-[#4A4A4A]/70 text-center mb-6">
                  You're viewing this inside another app. To install, open it in your phone's browser first:
                </p>
                <div className="space-y-4">
                  <Step n={1}>
                    <span>Tap the menu</span>
                    <MoreVertical className="w-5 h-5" />
                    <span>(or</span>
                    <Share className="w-5 h-5" />
                    <span>)</span>
                  </Step>
                  <Step n={2}>
                    <span>Choose</span>
                    <ExternalLink className="w-5 h-5" />
                    <span>"Open in Browser"</span>
                  </Step>
                  <Step n={3}><span>Tap "Download App" again there</span></Step>
                </div>
              </>
            ) : instructionMode === "apple-mobile" ? (
              <>
                <p className="text-[#4A4A4A]/70 text-center mb-6">To install on your iPhone or iPad:</p>
                <div className="space-y-4">
                  <Step n={1}>
                    <span>Tap the</span>
                    <Share className="w-5 h-5" />
                    <span>Share button</span>
                  </Step>
                  <Step n={2}>
                    <span>Tap</span>
                    <PlusSquare className="w-5 h-5" />
                    <span>"Add to Home Screen"</span>
                  </Step>
                  <Step n={3}><span>Turn on "Open as Web App" if shown</span></Step>
                  <Step n={4}><span>Tap "Add" to install</span></Step>
                </div>
              </>
            ) : instructionMode === "apple-desktop" ? (
              <>
                <p className="text-[#4A4A4A]/70 text-center mb-6">To install on your Mac:</p>
                <div className="space-y-4">
                  <Step n={1}><span>Open Club Nanny in Safari or Chrome</span></Step>
                  <Step n={2}><span>Safari: choose File, then "Add to Dock"</span></Step>
                  <Step n={3}><span>Chrome: choose More, then "Install page as app"</span></Step>
                  <Step n={4}><span>Confirm to add Club Nanny as an app</span></Step>
                </div>
              </>
            ) : instructionMode === "windows-desktop" ? (
              <>
                <p className="text-[#4A4A4A]/70 text-center mb-6">
                  On a Windows laptop, Club Nanny installs through Chrome or Microsoft Edge.
                </p>
                <div className="space-y-4">
                  <Step n={1}><span>Open this page in Chrome or Microsoft Edge</span></Step>
                  <Step n={2}>
                    <span>In Microsoft Edge, click the</span>
                    <EdgeAppsIcon />
                    <span>Apps icon</span>
                  </Step>
                  <Step n={3}><span>Choose "Install Club Nanny" and confirm</span></Step>
                </div>
              </>
            ) : instructionMode === "firefox-desktop" ? (
              <>
                <p className="text-[#4A4A4A]/70 text-center mb-6">
                  Firefox is not offering the Club Nanny app install option on this device.
                </p>
                <div className="space-y-4">
                  <Step n={1}><span>Copy this page link</span></Step>
                  <Step n={2}><span>Open it in Microsoft Edge or Chrome</span></Step>
                  <Step n={3}>
                    <span>In Edge, click the</span>
                    <EdgeAppsIcon />
                    <span>Apps icon</span>
                  </Step>
                  <Step n={4}><span>Choose "Install Club Nanny" and confirm</span></Step>
                </div>
              </>
            ) : (
              <>
                <p className="text-[#4A4A4A]/70 text-center mb-6">To install on Android or desktop:</p>
                <div className="space-y-4">
                  <Step n={1}>
                    <span>Tap the menu</span>
                    <MoreVertical className="w-5 h-5" />
                    <span>(top-right)</span>
                  </Step>
                  <Step n={2}><span>Choose "Install app" or "Add to Home screen"</span></Step>
                  <Step n={3}>
                    <span>On Microsoft Edge, use the</span>
                    <EdgeAppsIcon />
                    <span>Apps icon if shown</span>
                  </Step>
                  <Step n={4}><span>Confirm to install</span></Step>
                </div>
              </>
            )}

            <button
              onClick={() => setInstructionMode(null)}
              className="w-full mt-6 py-3 rounded-full font-medium text-white"
              style={{ backgroundColor: '#8BA99E' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
