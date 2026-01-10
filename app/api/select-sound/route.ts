import { NextResponse } from "next/server";
import sounds from "@/data/sounds.json";
import { getOpenIdFromSession } from "@/lib/session";
import { saveUserSound } from "@/lib/supabaseAdmin";

type Sound = {
  id: string;
  title: string;
  artist?: string;
  url: string;
  cml_url?: string;
  tags?: string[];
};

export async function POST(req: Request) {
  const openId = await getOpenIdFromSession();
  if (!openId) return NextResponse.redirect(new URL("/?err=not_connected", req.url));

  const form = await req.formData();
  const soundId = String(form.get("sound_id") || "");

  const list = sounds as unknown as Sound[];
  const sound = list.find((s) => s.id === soundId);

  if (!sound) return NextResponse.redirect(new URL("/sounds?err=unknown", req.url));

  await saveUserSound(openId, {
    sound_id: sound.id,
    title: sound.title,
    artist: sound.artist ?? null,
    url: sound.url,
    cml_url: sound.cml_url ?? null,
  });

  return NextResponse.redirect(new URL("/me?ok=1", req.url));
}


