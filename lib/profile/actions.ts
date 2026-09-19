"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState =
  | { error: string; success?: undefined }
  | { success: true; error?: undefined }
  | undefined;

const ROLES = ["student", "professional"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: FormDataEntryValue | null): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

export async function setRole(redirectTo: string, formData: FormData) {
  const role = formData.get("role");
  if (!isRole(role)) {
    redirect(`${redirectTo}?error=invalid_role`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", user.id);

  if (error) {
    redirect(`${redirectTo}?error=save_failed`);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function updateFullName(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const fullName = formData.get("full_name");
  if (typeof fullName !== "string" || fullName.trim().length === 0) {
    return { error: "Ingresa un nombre válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim() })
    .eq("user_id", user.id);

  if (error) {
    return { error: "No se pudo guardar el cambio. Inténtalo nuevamente." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
