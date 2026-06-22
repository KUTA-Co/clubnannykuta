import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installDemoSittingApi } from "./lib/demoSittingApi";
import "./index.css";

installDemoSittingApi();

// Register service worker for caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(() => {
        // Service worker registration failed silently
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
