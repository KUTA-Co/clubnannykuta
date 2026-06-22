// Validation schemas using Zod
import { z } from "zod";

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(255, "Email is too long");

/**
 * Password validation schema
 * Requires: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/**
 * Phone number validation schema
 */
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone number format")
  .min(10, "Phone number must be at least 10 digits")
  .max(20, "Phone number is too long");

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .regex(/^https?:\/\//, "URL must start with http:// or https://");

/**
 * Social media URL schemas
 */
export const linkedInSchema = z
  .string()
  .min(1, "LinkedIn URL is required")
  .url("Invalid LinkedIn URL")
  .refine((url) => url.includes("linkedin.com"), {
    message: "Must be a valid LinkedIn URL",
  });

export const facebookSchema = z
  .string()
  .optional()
  .refine((url) => !url || url.includes("facebook.com"), {
    message: "Must be a valid Facebook URL",
  });

export const instagramSchema = z
  .string()
  .optional()
  .refine((url) => !url || url.includes("instagram.com"), {
    message: "Must be a valid Instagram URL",
  });

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Registration form validation schema
 */
export const registrationSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
    phone: phoneSchema,
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Nanny profile validation schema
 */
export const nannyProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: emailSchema,
  phone: phoneSchema,
  bio: z.string().min(50, "Bio must be at least 50 characters").max(1000),
  hourlyRate: z.number().min(15, "Hourly rate must be at least $15").max(200, "Hourly rate is too high"),
  yearsExperience: z.number().min(0, "Experience cannot be negative").max(50),
  linkedIn: linkedInSchema,
  facebook: facebookSchema,
  instagram: instagramSchema,
});

/**
 * Booking form validation schema
 */
export const bookingSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  numberOfChildren: z.number().min(1, "Must have at least one child").max(10),
  specialInstructions: z.string().max(500, "Instructions are too long").optional(),
});

/**
 * Generic text input validation
 */
export const textInputSchema = z
  .string()
  .max(1000, "Text is too long")
  .refine((text) => !/<script|javascript:|data:/i.test(text), {
    message: "Invalid characters detected",
  });

/**
 * Validate any data against a schema
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: "Validation failed" } };
  }
}
