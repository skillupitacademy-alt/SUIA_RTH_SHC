import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1),
  platform: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1),
  name: z.string().min(1),
  platform: z.string().optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
