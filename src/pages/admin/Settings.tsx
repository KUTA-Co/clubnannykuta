import { useState } from "react";
import { Shield, Save } from "lucide-react";
import { useAuth, useAuthFetch } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { user, updateUser } = useAuth();
  const authFetch = useAuthFetch();
  const { toast } = useToast();
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentPassword) {
      toast({
        title: "Current password required",
        description: "Enter the current admin password before saving changes.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Confirm the new password before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload: Record<string, string> = { currentPassword };
      if (email && email !== user?.email) payload.email = email;
      if (newPassword) payload.newPassword = newPassword;

      const response = await authFetch("/api/admin/settings/credentials", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update admin credentials");
      }

      if (data.user) {
        updateUser(data.user);
        setEmail(data.user.email);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Admin credentials updated",
        description: "Use the updated details the next time you sign in.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update admin credentials.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-[#1A1A1A]">Admin Settings</h1>
        <p className="text-gray-500 mt-1">Update the admin username and password.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-11 h-11 rounded-xl bg-[#8BA99E]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#8BA99E]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#1A1A1A]">Login Details</h2>
            <p className="text-sm text-gray-500">The current password is required to save any change.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-email">Username / Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@clubnanny.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Enter current password"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="bg-[#8BA99E] hover:bg-[#7a9a8d]">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
