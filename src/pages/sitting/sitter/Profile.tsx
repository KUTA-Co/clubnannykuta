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
import { Loader2, Save, Star, User, Upload } from "lucide-react";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import { NotificationPermission } from "@/components/NotificationPermission";
import { formatHourlyRate, getApplicableHourlyRate } from "@/lib/sitterRates";

const API_URL = import.meta.env.VITE_API_URL || '';

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  age: z.coerce.number().min(16).max(100),
  bio: z.string().optional(),
  experience: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  ageGroupsWorkedWith: z.string().optional(),
  typesOfExperience: z.string().optional(),
  faithJourney: z.string().optional(),
  whyCalledToServe: z.string().optional(),
  specialSkills: z.string().optional(),
  hourlyRate1Kid: z.coerce.number().min(0).max(200),
  hourlyRate2Kids: z.coerce.number().min(0).max(200),
  hourlyRate3PlusKids: z.coerce.number().min(0).max(200),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(5, "Please enter a valid ZIP code"),
  preferredRadius: z.coerce.number().min(1).max(100)
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface SitterReview {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  familyId?: { householdName?: string };
}

export default function SitterProfile() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<SitterReview[]>([]);

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
          yearsOfExperience: data.profile.yearsOfExperience || '',
          ageGroupsWorkedWith: data.profile.ageGroupsWorkedWith || '',
          typesOfExperience: data.profile.typesOfExperience || '',
          faithJourney: data.profile.faithJourney || '',
          whyCalledToServe: data.profile.whyCalledToServe || '',
          specialSkills: data.profile.specialSkills || '',
          hourlyRate1Kid: data.profile.hourlyRate1Kid || data.profile.hourlyRate || 20,
          hourlyRate2Kids: data.profile.hourlyRate2Kids || data.profile.hourlyRate || 25,
          hourlyRate3PlusKids: data.profile.hourlyRate3PlusKids || data.profile.hourlyRate || 30,
          city: data.profile.city,
          state: data.profile.state,
          postalCode: data.profile.postalCode || '',
          preferredRadius: data.profile.preferredRadius || 15
        });
      }

      const reviewsResponse = await fetch(`${API_URL}/api/sitter/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const reviewsData = await reviewsResponse.json();
      if (reviewsData.success) {
        setReviews(reviewsData.reviews || []);
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
        body: JSON.stringify({
          ...data,
          hourlyRate: data.hourlyRate1Kid
        })
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
                  className="mt-1 min-h-[120px]"
                  placeholder="Describe your experience with children..."
                />
                {form.formState.errors.experience && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.experience.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    {...form.register("yearsOfExperience")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ageGroupsWorkedWith">Age Groups Worked With</Label>
                  <Input
                    id="ageGroupsWorkedWith"
                    {...form.register("ageGroupsWorkedWith")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="typesOfExperience">Types of Experience</Label>
                  <Input
                    id="typesOfExperience"
                    {...form.register("typesOfExperience")}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rates */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Hourly Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="hourlyRate1Kid">1 Child ($/hour)</Label>
                  <Input
                    id="hourlyRate1Kid"
                    type="number"
                    {...form.register("hourlyRate1Kid")}
                    className="mt-1"
                  />
                  {form.formState.errors.hourlyRate1Kid && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.hourlyRate1Kid.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="hourlyRate2Kids">2 Children ($/hour)</Label>
                  <Input
                    id="hourlyRate2Kids"
                    type="number"
                    {...form.register("hourlyRate2Kids")}
                    className="mt-1"
                  />
                  {form.formState.errors.hourlyRate2Kids && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.hourlyRate2Kids.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="hourlyRate3PlusKids">3+ Children ($/hour)</Label>
                  <Input
                    id="hourlyRate3PlusKids"
                    type="number"
                    {...form.register("hourlyRate3PlusKids")}
                    className="mt-1"
                  />
                  {form.formState.errors.hourlyRate3PlusKids && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.hourlyRate3PlusKids.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F5D5E5]/40 p-3 text-center text-sm">
                <div>
                  <p className="font-bold text-[#4A4A4A]">{formatHourlyRate(getApplicableHourlyRate(form.watch(), 1))}</p>
                  <p className="text-[#4A4A4A]/50">1 child</p>
                </div>
                <div>
                  <p className="font-bold text-[#4A4A4A]">{formatHourlyRate(getApplicableHourlyRate(form.watch(), 2))}</p>
                  <p className="text-[#4A4A4A]/50">2 children</p>
                </div>
                <div>
                  <p className="font-bold text-[#4A4A4A]">{formatHourlyRate(getApplicableHourlyRate(form.watch(), 3))}</p>
                  <p className="text-[#4A4A4A]/50">3+ children</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calling */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Faith & Calling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="faithJourney">Faith Journey</Label>
                <Textarea
                  id="faithJourney"
                  {...form.register("faithJourney")}
                  className="mt-1 min-h-[120px]"
                />
              </div>
              <div>
                <Label htmlFor="whyCalledToServe">Why You Feel Called to Serve</Label>
                <Textarea
                  id="whyCalledToServe"
                  {...form.register("whyCalledToServe")}
                  className="mt-1 min-h-[120px]"
                />
              </div>
              <div>
                <Label htmlFor="specialSkills">Special Skills</Label>
                <Textarea
                  id="specialSkills"
                  {...form.register("specialSkills")}
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" style={{ color: '#C77DA3' }} fill={profile?.reviewCount ? '#C77DA3' : 'none'} />
                Family Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-sm text-[#4A4A4A]/60">No reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review._id} className="rounded-xl border border-[#F5D5E5] p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className="w-4 h-4"
                              style={{ color: '#C77DA3' }}
                              fill={n <= review.rating ? '#C77DA3' : 'none'}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-[#4A4A4A]">
                          {review.familyId?.householdName || 'Family'}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#4A4A4A]/70">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
