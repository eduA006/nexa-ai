"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  credentialsSchema,
  emailSchema,
  newPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";

export type AuthActionState = { error: string } | undefined;

export async function login(
  redirectTo: string | undefined,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Correo o contraseña inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Credenciales incorrectas. Inténtalo nuevamente." };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo || "/dashboard");
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { email, password, full_name } = parsed.data;
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { full_name },
    },
  });

  if (!error && data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  if (error) {
    if (error.code === "over_email_send_rate_limit") {
      return {
        error:
          "Se alcanzó el límite de envío de correos. Espera unos minutos e inténtalo nuevamente.",
      };
    }

    const alreadyRegistered = /already registered|already exists/i.test(
      error.message,
    );
    return {
      error: alreadyRegistered
        ? "Ya existe una cuenta con este correo."
        : "No se pudo crear la cuenta. Inténtalo nuevamente.",
    };
  }

  redirect("/signup/revisa-tu-correo");
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: "Ingresa un correo válido." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${origin}/auth/callback?next=/reset-password` },
  );

  if (error?.code === "over_email_send_rate_limit") {
    return {
      error:
        "Se alcanzó el límite de envío de correos. Espera unos minutos e inténtalo nuevamente.",
    };
  }

  // Para cualquier otro caso no revelamos si el correo existe o no.
  redirect("/forgot-password/revisa-tu-correo");
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "No se pudo actualizar la contraseña. Solicita un nuevo enlace." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
