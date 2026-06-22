import { useEffect, useState } from "react";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeHome, setActiveHome] = useState(1);

  useEffect(() => {
    // Cycle through homes 1, 2, 3
    const interval = setInterval(() => {
      setActiveHome((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500); // Change every 500ms

    // Hide preloader after 1.5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-8">
        {/* Club Nanny Logo - matching nav style */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium tracking-widest" style={{ color: '#8BA99E' }}>CLUB</span>
          <span className="text-6xl font-bold font-heading -mt-2" style={{ color: '#8BA99E' }}>NANNY</span>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeHome >= 1 ? 'bg-[#8BA99E]' : 'bg-[#8BA99E]/20'
            }`}
          />
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeHome >= 2 ? 'bg-[#8BA99E]' : 'bg-[#8BA99E]/20'
            }`}
          />
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeHome >= 3 ? 'bg-[#8BA99E]' : 'bg-[#8BA99E]/20'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
