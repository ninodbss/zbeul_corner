import "server-only";
import { createClient } from "@supabase/supabase-js";

export type UserSoundRow = {
  open_id: string;
  sound_id: string;
  title: string;
  artist: string | null;
  url: string;
  cml_url: string | null;
  updated_at?: string;
};

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ✅ enregistre/écrase le son choisi pour un open_id
export async function saveUserSound(openId: string, payload: Omit<UserSoundRow, "open_id">) {
  const sb = supabaseAdmin();

  const row: UserSoundRow = {
    open_id: openId,
    ...payload,
  };

  const { error } = await (sb as any)
    .from("user_sounds")
    .upsert(row, { onConflict: "open_id" });

  if (error) throw error;
}

// ✅ récupère le son choisi pour un open_id
export async function getUserSound(openId: string): Promise<UserSoundRow | null> {
  const sb = supabaseAdmin();

  const { data, error } = await (sb as any)
    .from("user_sounds")
    .select("*")
    .eq("open_id", openId)
    .maybeSingle();

  if (error) throw error;
  return (data as UserSoundRow) ?? null;
}

// ✅ (optionnel) helper déjà utilisé dans ton projet
export async function getSelectedSound(openId: string) {
  return getUserSound(openId);
}


