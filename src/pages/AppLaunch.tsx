import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSittingAppRoute } from "@/lib/sittingAppRoute";

export default function AppLaunch() {
  const { isLoading, isAuthenticated, token } = useAuth();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !token) {
      setTarget("/sitting/login");
      return;
    }

    let isActive = true;
    setTarget(null);

    resolveSittingAppRoute(token).then((route) => {
      if (isActive) setTarget(route);
    });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isLoading, token]);

  if (target) {
    return <Navigate to={target} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FAF9F6" }}>
      <div className="text-center">
        <img src="/FinalLogo.jpg" alt="Club Nanny" className="h-16 mx-auto mb-5" />
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#8BA99E]/30 border-t-[#8BA99E] animate-spin" />
        <p className="mt-4 text-sm text-[#4A4A4A]/60">Opening your app...</p>
      </div>
    </div>
  );
}
