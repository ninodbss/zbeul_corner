import sounds from "@/data/sounds.json";

export type Sound = {
  id: string;
  title: string;
  artist?: string;
  url?: string;
  creativeCenterUrl?: string;
  cmlUrl?: string;
  durationSec?: number;
  region?: string;
  tags?: string[];
};

const soundList = sounds as Sound[];
const soundIds = new Set(soundList.map((sound) => sound.id));

export function getSounds(): Sound[] {
  return soundList;
}

export function getSoundById(soundId: string): Sound | null {
  return soundList.find((sound) => sound.id === soundId) ?? null;
}

export function isKnownSoundId(soundId: string): boolean {
  return soundIds.has(soundId);
}
