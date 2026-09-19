"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const callbackUrl = new URL("/auth/callback", origin ?? undefined);
  if (redirectTo) callbackUrl.searchParams.set("redirectTo", redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_init_failed");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
