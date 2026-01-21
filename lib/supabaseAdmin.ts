import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UserSoundRow = {
  open_id: string;
  sound_id: string;
  title: string;
  artist: string | null;
  url: string;
  cml_url: string | null;
  updated_at?: string;
};

let _admin: SupabaseClient | null = null;

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error(`[supabaseAdmin] Missing env var: ${name}`);
    throw new Error(`Missing ${name}`);
  }
  return v;
}

export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;

  const url = mustEnv("SUPABASE_URL");
  const key = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

  _admin = createClient(url, key, {
    auth: { persistSession: false },
    global: {
      headers: { "X-Client-Info": "zbeul_corner-admin" },
    },
  });

  return _admin;
}

// ✅ enregistre/écrase le son choisi pour un open_id
export async function saveUserSound(
  openId: string,
  payload: Omit<UserSoundRow, "open_id">
) {
  if (!openId || !openId.trim()) throw new Error("saveUserSound: missing openId");

  const sb = supabaseAdmin();

  const row: UserSoundRow = {
    open_id: openId,
    ...payload,
  };

  const { error } = await (sb as any)
    .from("user_sounds")
    .upsert(row, { onConflict: "open_id" });

  if (error) {
    console.error("[saveUserSound] Supabase error:", error);
    throw error;
  }

  return true;
}

// ✅ récupère le son choisi pour un open_id
export async function getUserSound(openId: string): Promise<UserSoundRow | null> {
  if (!openId || !openId.trim()) throw new Error("getUserSound: missing openId");

  const sb = supabaseAdmin();

  const { data, error } = await (sb as any)
    .from("user_sounds")
    .select("*")
    .eq("open_id", openId)
    .maybeSingle();

  if (error) {
    console.error("[getUserSound] Supabase error:", error);
    throw error;
  }

  return (data as UserSoundRow) ?? null;
}

// ✅ alias (optionnel) déjà utilisé dans ton projet
export async function getSelectedSound(openId: string) {
  return getUserSound(openId);
}


