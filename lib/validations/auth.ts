import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().email({ message: "Ingresa un correo válido." }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export const signupSchema = credentialsSchema.extend({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Ingresa tu nombre completo." }),
});

export type SignupData = z.infer<typeof signupSchema>;

export const emailSchema = z.object({
  email: z.string().trim().email({ message: "Ingresa un correo válido." }),
});

export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});
