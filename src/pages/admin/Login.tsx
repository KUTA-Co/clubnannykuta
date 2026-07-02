import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      if (result.user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        setError("Access denied. Admin privileges required.");
        logout();
      }
    } else {
      setError(result.message || "Login failed. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/FinalLogo.jpg"
            alt="Club Nanny"
            className="h-16 mx-auto mb-3"
          />
          <p className="text-white/40 text-sm">Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-[#8BA99E]/10 rounded-2xl mx-auto mb-6">
              <Lock className="w-8 h-8 text-[#8BA99E]" />
            </div>

            <h2 className="text-2xl font-bold text-center text-[#1A1A1A] mb-2">
              Admin Sign In
            </h2>
            <p className="text-center text-gray-500 text-sm mb-8">
              Enter your credentials to access the admin portal
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#4A4A4A]">
                  Email Address
                </Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#4A4A4A]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E] pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#1A1A1A] hover:bg-[#2a2a2a] text-white rounded-xl font-medium"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>

          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500">
              Authorized personnel only. All access is logged.
            </p>
          </div>
        </div>

        {/* Back to site link */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            ← Back to Club Nanny
          </a>
        </div>
      </div>
    </div>
  );
}
