import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Upload } from "lucide-react";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import { NotificationPermission } from "@/components/NotificationPermission";

const API_URL = import.meta.env.VITE_API_URL || '';

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  age: z.coerce.number().min(16).max(100),
  bio: z.string().optional(),
  experience: z.string().optional(),
  hourlyRate: z.coerce.number().min(10).max(100),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(5, "Please enter a valid ZIP code"),
  preferredRadius: z.coerce.number().min(1).max(100)
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SitterProfile() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sitter/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        form.reset({
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          phone: data.profile.phone || '',
          age: data.profile.age || 18,
          bio: data.profile.bio || '',
          experience: data.profile.experience || '',
          hourlyRate: data.profile.hourlyRate || 20,
          city: data.profile.city,
          state: data.profile.state,
          postalCode: data.profile.postalCode || '',
          preferredRadius: data.profile.preferredRadius || 15
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const photoUrl = await resizeImageToDataUrl(file);
      const response = await fetch(`${API_URL}/api/sitter/profile/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ photoUrl })
      });
      const result = await response.json();
      if (result.success) {
        setProfile(result.profile);
        toast({ title: "Photo updated" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to upload photo", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not process that image. Try a different one.", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/sitter/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.profile);
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully."
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E8A0BF' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-heading text-[#4A4A4A]">My Profile</h1>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium capitalize"
            style={{
              backgroundColor: profile?.status === 'active' ? '#D4EDDA' : '#FFF3CD',
              color: profile?.status === 'active' ? '#155724' : '#856404'
            }}
          >
            {profile?.status?.replace('_', ' ') || 'Unknown'}
          </span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Photo */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Profile Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#F5D5E5' }}
                >
                  {profile?.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12" style={{ color: '#C77DA3' }} />
                  )}
                </div>
                <div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <label htmlFor="photo-upload">
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: '#E8A0BF' }}
                    >
                      {uploadingPhoto ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> {profile?.profilePhoto ? 'Change Photo' : 'Upload Photo'}</>
                      )}
                    </span>
                  </label>
                  <p className="text-xs text-[#4A4A4A]/50 mt-2">JPG or PNG, resized automatically.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    className="mt-1"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    className="mt-1"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register("phone")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    {...form.register("age")}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...form.register("state")}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">ZIP Code</Label>
                  <Input
                    id="postalCode"
                    {...form.register("postalCode")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="preferredRadius">Radius (miles)</Label>
                  <Input
                    id="preferredRadius"
                    type="number"
                    {...form.register("preferredRadius")}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">About Me & Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  {...form.register("bio")}
                  className="mt-1 min-h-[100px]"
                  placeholder="Tell families about yourself..."
                />
                {form.formState.errors.bio && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.bio.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="experience">Childcare Experience</Label>
                <Textarea
                  id="experience"
                  {...form.register("experience")}
                  className="mt-1 min-h-[80px]"
                  placeholder="Describe your experience with children..."
                />
                {form.formState.errors.experience && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.experience.message}</p>
                )}
              </div>

              <div className="w-48">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  {...form.register("hourlyRate")}
                  className="mt-1"
                />
                {form.formState.errors.hourlyRate && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.hourlyRate.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationPermission variant="inline" />
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: '#E8A0BF' }}
            className="text-white hover:opacity-90"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
