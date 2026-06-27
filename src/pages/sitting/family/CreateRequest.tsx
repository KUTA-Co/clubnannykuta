import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, Send, MapPin } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || '';
const TIME_VALUE_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const parseDateTime = (dateValue: string, timeValue: string) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);

  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes);
};

const parseRequestDateTimes = (dateValue: string, startTime: string, endTime: string) => {
  const startDateTime = parseDateTime(dateValue, startTime);
  const endDateTime = parseDateTime(dateValue, endTime);

  if (startDateTime && endDateTime && endDateTime <= startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  return { startDateTime, endDateTime };
};

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const requestSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string()
    .min(1, "Start time is required")
    .refine((value) => !value || TIME_VALUE_PATTERN.test(value), "Choose a complete start time"),
  endTime: z.string()
    .min(1, "End time is required")
    .refine((value) => !value || TIME_VALUE_PATTERN.test(value), "Choose a complete end time"),
  useProfileAddress: z.boolean().default(true),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  numberOfChildren: z.coerce.number().min(1, "At least 1 child required"),
  childrenAges: z.string().optional(),
  notes: z.string().optional(),
  specialInstructions: z.string().optional()
}).superRefine((data, ctx) => {
  const { startDateTime } = parseRequestDateTimes(data.date, data.startTime, data.endTime);

  if (startDateTime && startDateTime < new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Start time cannot be in the past",
      path: ["startTime"]
    });
  }

  if (!data.useProfileAddress) {
    ([
      ["address", "Street address is required"],
      ["city", "City is required"],
      ["state", "State is required"],
      ["postalCode", "ZIP code is required"]
    ] as const).forEach(([field, message]) => {
      if (!data[field]?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [field]
        });
      }
    });
  }
});

type RequestFormData = z.infer<typeof requestSchema>;
type RepeatRequest = Partial<Pick<
  RequestFormData,
  'startTime' | 'endTime' | 'numberOfChildren' | 'childrenAges' | 'notes' | 'specialInstructions' | 'address' | 'city' | 'state' | 'postalCode'
>>;
type BookingRequestPayload = {
  date: string;
  startTime: string;
  endTime: string;
  numberOfChildren: number;
  notes?: string;
  specialInstructions?: string;
  childrenAges?: number[];
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

interface Profile {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  children: { name: string; age: number }[];
}

export default function CreateRequest() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  // Set when arriving via "Book Again" — prefills the form from a past booking
  const repeat = (routerLocation.state as { repeat?: RepeatRequest } | null)?.repeat;
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      useProfileAddress: true,
      numberOfChildren: 1
    }
  });

  const useProfileAddress = form.watch('useProfileAddress');
  const profileHasLocation = Boolean(
    profile?.address?.trim() &&
    profile?.city?.trim() &&
    profile?.state?.trim() &&
    profile?.postalCode?.trim()
  );
  const shouldUseProfileAddress = Boolean(profile && profileHasLocation && useProfileAddress);
  const showCustomAddress = !shouldUseProfileAddress;
  const fieldClass = (hasError?: boolean) => cn(
    "mt-1",
    hasError && "border-red-500 ring-1 ring-red-500/40 focus-visible:ring-red-500"
  );
  const pickerClass = (hasError?: boolean) => cn(
    "mt-1",
    hasError && "border-red-500 ring-1 ring-red-500/40 focus-visible:ring-red-500"
  );

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // "Book Again": prefill the form from a past booking (family just picks a new date)
  useEffect(() => {
    if (!repeat) return;
    if (repeat.startTime) form.setValue('startTime', repeat.startTime);
    if (repeat.endTime) form.setValue('endTime', repeat.endTime);
    if (repeat.numberOfChildren) form.setValue('numberOfChildren', repeat.numberOfChildren);
    if (repeat.childrenAges) form.setValue('childrenAges', repeat.childrenAges);
    if (repeat.notes) form.setValue('notes', repeat.notes);
    if (repeat.specialInstructions) form.setValue('specialInstructions', repeat.specialInstructions);
    if (repeat.address || repeat.city) {
      form.setValue('useProfileAddress', false);
      form.setValue('address', repeat.address || '');
      form.setValue('city', repeat.city || '');
      form.setValue('state', repeat.state || '');
      form.setValue('postalCode', repeat.postalCode || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sitting/family/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        const hasLocation = Boolean(
          data.profile?.address?.trim() &&
          data.profile?.city?.trim() &&
          data.profile?.state?.trim() &&
          data.profile?.postalCode?.trim()
        );
        form.setValue('useProfileAddress', hasLocation);
        // Prefill children count + ages from the profile (skipped when repeating a past booking)
        if (!repeat) {
          form.setValue('numberOfChildren', data.profile.children?.length || 1);
          if (data.profile.children?.length) {
            form.setValue(
              'childrenAges',
              data.profile.children.map((c: { age: number }) => c.age).filter((a: number) => a != null).join(', ')
            );
          }
        }
      } else {
        form.setValue('useProfileAddress', false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      form.setValue('useProfileAddress', false);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RequestFormData) => {
    setSubmitting(true);
    try {
      if (data.useProfileAddress && !profileHasLocation) {
        form.setValue('useProfileAddress', false, { shouldValidate: true });
        await form.trigger(['address', 'city', 'state', 'postalCode']);
        toast({
          title: "Location needed",
          description: "Please add the job address before posting your request.",
          variant: "destructive"
        });
        return;
      }

      const requestData: BookingRequestPayload = {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        numberOfChildren: data.numberOfChildren,
        notes: data.notes,
        specialInstructions: data.specialInstructions
      };

      // Parse children ages if provided
      if (data.childrenAges) {
        requestData.childrenAges = data.childrenAges.split(',').map(a => parseInt(a.trim())).filter(a => !isNaN(a));
      }

      // Use profile address or custom address
      if (shouldUseProfileAddress && profile) {
        requestData.address = profile.address;
        requestData.city = profile.city;
        requestData.state = profile.state;
        requestData.postalCode = profile.postalCode;
      } else {
        requestData.address = data.address?.trim();
        requestData.city = data.city?.trim();
        requestData.state = data.state?.trim();
        requestData.postalCode = data.postalCode?.trim();
      }

      const response = await fetch(`${API_URL}/api/sitting/family/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Request Posted!",
          description: "Sitters in your area can now see your request."
        });
        navigate('/sitting/family/requests');
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create request",
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
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#C77DA3' }}></div>
      </div>
    );
  }

  const today = new Date();
  const minDate = formatDateInputValue(today);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold font-heading mb-6 text-[#4A4A4A]">Post a Babysitting Request</h1>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Date & Time */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">When do you need a sitter?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
                className={fieldClass(Boolean(form.formState.errors.date))}
                min={minDate}
                aria-invalid={Boolean(form.formState.errors.date)}
              />
              {form.formState.errors.date && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Controller
                  name="startTime"
                  control={form.control}
                  render={({ field }) => (
                    <TimePicker
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Select start time"
                      className={pickerClass(Boolean(form.formState.errors.startTime))}
                    />
                  )}
                />
                {form.formState.errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.startTime.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Controller
                  name="endTime"
                  control={form.control}
                  render={({ field }) => (
                    <TimePicker
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Select end time"
                      className={pickerClass(Boolean(form.formState.errors.endTime))}
                    />
                  )}
                />
                {form.formState.errors.endTime && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: '#C77DA3' }} />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile && profileHasLocation && (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="useProfileAddress"
                  checked={useProfileAddress}
                  onCheckedChange={(checked) => {
                    form.setValue('useProfileAddress', checked as boolean, { shouldValidate: true });
                    if (checked) {
                      form.clearErrors(['address', 'city', 'state', 'postalCode']);
                    }
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor="useProfileAddress" className="cursor-pointer">
                    Use my home address
                  </Label>
                  {profile.address && (
                    <p className="text-sm text-[#4A4A4A]/60 mt-1">
                      {profile.address}, {profile.city}, {profile.state} {profile.postalCode}
                    </p>
                  )}
                </div>
              </div>
            )}

            {profile && !profileHasLocation && (
              <div className="p-3 rounded-lg text-sm bg-yellow-50 text-yellow-800">
                Your household profile does not have a complete address yet. Add the job location below for this request.
              </div>
            )}

            {showCustomAddress && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    {...form.register("address")}
                    className={fieldClass(Boolean(form.formState.errors.address))}
                    aria-invalid={Boolean(form.formState.errors.address)}
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
                      className={fieldClass(Boolean(form.formState.errors.city))}
                      aria-invalid={Boolean(form.formState.errors.city)}
                    />
                    {form.formState.errors.city && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      {...form.register("state")}
                      className={fieldClass(Boolean(form.formState.errors.state))}
                      aria-invalid={Boolean(form.formState.errors.state)}
                    />
                    {form.formState.errors.state && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.state.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">ZIP</Label>
                    <Input
                      id="postalCode"
                      {...form.register("postalCode")}
                      className={fieldClass(Boolean(form.formState.errors.postalCode))}
                      aria-invalid={Boolean(form.formState.errors.postalCode)}
                    />
                    {form.formState.errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.postalCode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Children Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Children</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numberOfChildren">Number of Children</Label>
                <Input
                  id="numberOfChildren"
                  type="number"
                  min="1"
                  max="10"
                  {...form.register("numberOfChildren")}
                  className={fieldClass(Boolean(form.formState.errors.numberOfChildren))}
                  aria-invalid={Boolean(form.formState.errors.numberOfChildren)}
                />
                {form.formState.errors.numberOfChildren && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.numberOfChildren.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="childrenAges">Ages (comma separated)</Label>
                <Input
                  id="childrenAges"
                  {...form.register("childrenAges")}
                  className="mt-1"
                  placeholder="e.g., 3, 5, 8"
                />
              </div>
            </div>

            {profile?.children && profile.children.length > 0 && (
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-sm text-[#4A4A4A]/60 mb-2">Your registered children:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.children.map((child, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ backgroundColor: '#F5D5E5', color: '#C77DA3' }}
                    >
                      {child.name} ({child.age})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes for Sitter</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                className="mt-1"
                placeholder="Any details about the job, your home, parking, etc."
              />
            </div>

            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                {...form.register("specialInstructions")}
                className="mt-1"
                placeholder="Allergies, bedtime routines, medication needs, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: '#C77DA3' }}
            className="text-white hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" /> Post Request
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
