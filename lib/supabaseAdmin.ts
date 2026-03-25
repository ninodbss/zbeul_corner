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

let adminClient: SupabaseClient | null = null;

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function supabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  adminClient = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
    global: {
      headers: { "X-Client-Info": "zbeul_corner-admin" },
    },
  });

  return adminClient;
}

export async function saveUserSound(openId: string, payload: Omit<UserSoundRow, "open_id">) {
  if (!openId.trim()) throw new Error("saveUserSound: missing openId");

  const row: UserSoundRow = {
    open_id: openId,
    ...payload,
  };

  const { error } = await supabaseAdmin().from("user_sounds").upsert(row, { onConflict: "open_id" });
  if (error) throw error;

  return true;
}

export async function getUserSound(openId: string): Promise<UserSoundRow | null> {
  if (!openId.trim()) throw new Error("getUserSound: missing openId");

  const { data, error } = await supabaseAdmin().from("user_sounds").select("*").eq("open_id", openId).maybeSingle();
  if (error) throw error;

  return (data as UserSoundRow | null) ?? null;
}

export async function getSelectedSound(openId: string) {
  return getUserSound(openId);
}
