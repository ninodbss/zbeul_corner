import { NextResponse } from "next/server";
import { getOpenIdFromSession } from "@/lib/session";
import { getSoundById } from "@/lib/sounds";
import { saveUserSound } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const openId = await getOpenIdFromSession();
  if (!openId) {
    return NextResponse.redirect(new URL("/?err=login", req.url));
  }

  const form = await req.formData();
  const soundId = String(form.get("sound_id") ?? "").trim();
  if (!soundId) {
    return NextResponse.redirect(new URL("/sounds?err=missing_sound", req.url));
  }

  const sound = getSoundById(soundId);
  if (!sound) {
    return NextResponse.redirect(new URL("/sounds?err=invalid_sound", req.url));
  }

  await saveUserSound(openId, {
    sound_id: sound.id,
    title: sound.title,
    artist: sound.artist ?? null,
    url: sound.url ?? "",
    cml_url: sound.creativeCenterUrl ?? sound.cmlUrl ?? null,
  });

  return NextResponse.redirect(new URL("/me?ok=sound", req.url), { status: 303 });
}
