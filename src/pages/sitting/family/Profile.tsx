import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2, Star } from "lucide-react";
import { NotificationPermission } from "@/components/NotificationPermission";

const API_URL = import.meta.env.VITE_API_URL || '';

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(0).max(18),
  specialNeeds: z.string().optional()
});

const profileSchema = z.object({
  householdName: z.string().min(1, "Household name is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(5, "Please enter a valid ZIP code"),
  children: z.array(childSchema).min(1, "At least one child is required"),
  emergencyName: z.string().min(1, "Emergency contact name is required"),
  emergencyPhone: z.string().min(10, "Please enter a valid phone number"),
  emergencyRelationship: z.string().min(1, "Relationship is required")
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function FamilyProfile() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState<{ averageRating: number; reviewCount: number }>({ averageRating: 0, reviewCount: 0 });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      children: [{ name: '', age: 0, specialNeeds: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "children"
  });

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sitting/family/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const profile = data.profile;
        setRating({ averageRating: profile.averageRating || 0, reviewCount: profile.reviewCount || 0 });
        form.reset({
          householdName: profile.householdName,
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city,
          state: profile.state,
          postalCode: profile.postalCode || '',
          children: profile.children?.length > 0 ? profile.children : [{ name: '', age: 0, specialNeeds: '' }],
          emergencyName: profile.emergencyContact?.name || '',
          emergencyPhone: profile.emergencyContact?.phone || '',
          emergencyRelationship: profile.emergencyContact?.relationship || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/sitting/family/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          householdName: data.householdName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          children: data.children,
          emergencyContact: {
            name: data.emergencyName,
            phone: data.emergencyPhone,
            relationship: data.emergencyRelationship
          }
        })
      });

      const result = await response.json();

      if (result.success) {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#C77DA3' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-[#4A4A4A]">My Household</h1>
        <div className="flex items-center gap-1 text-sm text-[#4A4A4A]/70">
          <Star className="w-4 h-4" style={{ color: '#C77DA3' }} fill={rating.reviewCount ? '#C77DA3' : 'none'} />
          {rating.reviewCount
            ? `${rating.averageRating.toFixed(1)} (${rating.reviewCount} ${rating.reviewCount === 1 ? 'review' : 'reviews'})`
            : 'No reviews yet'}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Household Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Household Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="householdName">Household Name</Label>
                <Input
                  id="householdName"
                  {...form.register("householdName")}
                  className="mt-1"
                />
                {form.formState.errors.householdName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.householdName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register("phone")}
                  className="mt-1"
                />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  className="mt-1"
                />
                {form.formState.errors.address && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <Label htmlFor="postalCode">ZIP</Label>
                  <Input
                    id="postalCode"
                    {...form.register("postalCode")}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Children */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Children</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-xl space-y-3" style={{ borderColor: '#F5D5E5' }}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#4A4A4A]">Child {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        {...form.register(`children.${index}.name`)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Input
                        type="number"
                        {...form.register(`children.${index}.age`)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Special Needs (optional)</Label>
                    <Input
                      {...form.register(`children.${index}.specialNeeds`)}
                      className="mt-1"
                      placeholder="Allergies, medical conditions, etc."
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: '', age: 0, specialNeeds: '' })}
                className="w-full"
                style={{ borderColor: '#C77DA3', color: '#C77DA3' }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Another Child
              </Button>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    {...form.register("emergencyName")}
                    className="mt-1"
                  />
                  {form.formState.errors.emergencyName && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.emergencyName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Phone Number</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    {...form.register("emergencyPhone")}
                    className="mt-1"
                  />
                  {form.formState.errors.emergencyPhone && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.emergencyPhone.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Input
                    id="emergencyRelationship"
                    {...form.register("emergencyRelationship")}
                    className="mt-1"
                    placeholder="e.g., Grandmother"
                  />
                  {form.formState.errors.emergencyRelationship && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.emergencyRelationship.message}</p>
                  )}
                </div>
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
            style={{ backgroundColor: '#C77DA3' }}
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
