import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { resolveSittingAppRoute } from "@/lib/sittingAppRoute";

const TOKEN_KEY = "club_nanny_token";

const getStoredToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Where to send the user after a successful login. We ask the backend which
  // sitting profile(s) they actually have, so a nanny-program "family" with no
  // sitting profile doesn't land on a broken dashboard.
  const redirectAfterLogin = async (authToken?: string) => {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    if (from) return navigate(from, { replace: true });

    const token = authToken || getStoredToken();
    const target = await resolveSittingAppRoute(token);
    navigate(target, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        await redirectAfterLogin(result.token);
      } else {
        toast({
          title: "Sign in failed",
          description: result.message || "Check your email and password and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/for-sitters" className="flex justify-center mb-2">
            <img src="/clubnannynobg.png" alt="Club Nanny" className="h-12" />
          </Link>
          <CardTitle className="text-2xl font-heading text-[#4A4A4A]">Sign In</CardTitle>
          <p className="text-sm text-[#4A4A4A]/60">Access your Club Nanny dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: "#C77DA3" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#4A4A4A]/70 space-y-1">
            <p>
              New sitter?{" "}
              <Link to="/sitting/register/sitter" className="font-medium" style={{ color: "#C77DA3" }}>
                Register here
              </Link>
            </p>
            <p>
              Need a sitter?{" "}
              <Link to="/sitting/register/family" className="font-medium" style={{ color: "#C77DA3" }}>
                Sign up as a family
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
