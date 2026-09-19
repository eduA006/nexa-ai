import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().email({ message: "Ingresa un correo válido." }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export type Credentials = z.infer<typeof credentialsSchema>;
