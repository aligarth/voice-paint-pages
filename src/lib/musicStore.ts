import { useEffect, useState } from "react";

export type Track = { id: string; name: string; url: string };

type MusicState = {
  asked: boolean;
  enabled: boolean;
  tracks: Track[];
  index: number;
  playing: boolean;
  volume: number;
};

const state: MusicState = {
  asked: false,
  enabled: false,
  tracks: [],
  index: 0,
  playing: false,
  volume: 0.5,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let audio: HTMLAudioElement | null = null;
function el() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio();
    audio.loop = false;
    audio.volume = state.volume;
    audio.addEventListener("ended", () => next());
    audio.addEventListener("pause", () => {
      state.playing = false;
      emit();
    });
    audio.addEventListener("play", () => {
      state.playing = true;
      emit();
    });
  }
  return audio;
}

function load(play: boolean) {
  const a = el();
  const track = state.tracks[state.index];
  if (!a || !track) return;
  if (a.src !== track.url) a.src = track.url;
  a.volume = state.volume;
  if (play) void a.play().catch(() => undefined);
}

const STORAGE_KEY = "cmw-music-prompt";

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ asked: state.asked, enabled: state.enabled }),
    );
  } catch {
    /* storage unavailable */
  }
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as { asked?: boolean; enabled?: boolean };
    state.asked = Boolean(saved.asked);
    state.enabled = Boolean(saved.enabled);
  } catch {
    /* ignore bad data */
  }
}

export function useMusic() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    hydrate();
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { ...state, current: state.tracks[state.index] ?? null };
}

export function dismissMusicPrompt() {
  state.asked = true;
  state.enabled = false;
  persist();
  emit();
}

export function enableMusic() {
  state.asked = true;
  state.enabled = true;
  persist();
  emit();
}

/** Brings the music prompt back after it was dismissed. */
export function resetMusicPrompt() {
  state.asked = false;
  state.enabled = false;
  persist();
  emit();
}

export function addTracks(files: File[]) {
  const added = files.map((file, i) => ({
    id: `${Date.now()}-${i}-${file.name}`,
    name: file.name.replace(/\.[^.]+$/, ""),
    url: URL.createObjectURL(file),
  }));
  if (!added.length) return;
  const wasEmpty = state.tracks.length === 0;
  state.tracks = [...state.tracks, ...added];
  state.asked = true;
  state.enabled = true;
  if (wasEmpty) {
    state.index = 0;
    load(true);
  }
  emit();
}

export function playTrack(index: number) {
  if (index < 0 || index >= state.tracks.length) return;
  state.index = index;
  load(true);
  emit();
}

export function toggleMusic() {
  const a = el();
  if (!a || !state.tracks.length) return;
  if (state.playing) a.pause();
  else load(true);
  emit();
}

export function next() {
  if (!state.tracks.length) return;
  playTrack((state.index + 1) % state.tracks.length);
}

export function prev() {
  if (!state.tracks.length) return;
  playTrack((state.index - 1 + state.tracks.length) % state.tracks.length);
}

export function setVolume(v: number) {
  state.volume = v;
  const a = el();
  if (a) a.volume = v;
  emit();
}

export function removeTrack(id: string) {
  const i = state.tracks.findIndex((t) => t.id === id);
  if (i === -1) return;
  const wasCurrent = i === state.index;
  const track = state.tracks[i];
  if (track) URL.revokeObjectURL(track.url);
  state.tracks = state.tracks.filter((t) => t.id !== id);
  if (!state.tracks.length) {
    el()?.pause();
    state.index = 0;
  } else if (wasCurrent) {
    state.index = i % state.tracks.length;
    load(true);
  } else if (i < state.index) {
    state.index -= 1;
  }
  emit();
}
