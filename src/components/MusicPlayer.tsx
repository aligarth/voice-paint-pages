import { useRef } from "react";
import { Music, Play, Pause, SkipBack, SkipForward, Trash2, Volume2, X } from "lucide-react";
import {
  addTracks,
  dismissMusicPrompt,
  enableMusic,
  next,
  playTrack,
  prev,
  removeTrack,
  setVolume,
  toggleMusic,
  useMusic,
} from "@/lib/musicStore";
import { cn } from "@/lib/utils";

export function MusicPlayer({ compact = false }: { compact?: boolean }) {
  const music = useMusic();
  const input = useRef<HTMLInputElement | null>(null);

  const picker = (
    <input
      ref={input}
      type="file"
      accept="audio/*"
      multiple
      className="hidden"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        addTracks(files);
      }}
    />
  );

  if (compact) {
    if (!music.tracks.length) return null;
    return (
      <div className="paper-card flex items-center gap-3 p-3">
        <Music className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{music.current?.name}</span>
        <button type="button" onClick={prev} className="btn-crayon px-2 py-1" aria-label="Previous song">
          <SkipBack className="h-4 w-4" />
        </button>
        <button type="button" onClick={toggleMusic} className="btn-crayon px-2 py-1" aria-label={music.playing ? "Pause music" : "Play music"}>
          {music.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button type="button" onClick={next} className="btn-crayon px-2 py-1" aria-label="Next song">
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const services = [
    { name: "Apple Music", url: "https://music.apple.com/" },
    { name: "Spotify", url: "https://open.spotify.com/" },
    { name: "Pandora", url: "https://www.pandora.com/" },
    { name: "YouTube Music", url: "https://music.youtube.com/" },
    { name: "Amazon Music", url: "https://music.amazon.com/" },
    { name: "SoundCloud", url: "https://soundcloud.com/discover" },
    { name: "iHeartRadio", url: "https://www.iheart.com/" },
    { name: "Tidal", url: "https://listen.tidal.com/" },
  ];

  const serviceButtons = (
    <div className="mt-5">
      <p className="text-center text-sm font-bold">Or open your favorite music app</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {services.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="btn-crayon"
            aria-label={`Play ${s.name}`}
          >
            <ExternalLink className="h-4 w-4" /> {s.name}
          </a>
        ))}
      </div>
      <p className="mx-auto mt-2 max-w-md text-center text-xs text-muted-foreground">
        Your music app opens in another tab and keeps playing while you color here.
      </p>
    </div>
  );

  return (
    <section className="paper-card mx-auto mt-6 max-w-2xl p-6 sm:p-8">
      {picker}
      <h2 className="flex items-center justify-center gap-2 text-center text-2xl font-extrabold">
        <Music className="h-6 w-6" /> Want music while you color?
      </h2>

      {!music.enabled ? (
        <>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
            Play songs already downloaded on your phone, tablet or computer — or jump straight into
            Apple Music, Spotify, Pandora and more.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                enableMusic();
                input.current?.click();
              }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-7 py-3 text-lg font-extrabold text-primary-foreground transition-transform hover:-translate-y-1"
            >
              <Music className="h-5 w-5" /> Yes, play my music
            </button>
            <button type="button" onClick={dismissMusicPrompt} className="btn-crayon">
              <X className="h-4 w-4" /> No thanks
            </button>
          </div>
          {serviceButtons}
        </>
      ) : (

        <>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => input.current?.click()} className="btn-crayon">
              <Music className="h-4 w-4" /> {music.tracks.length ? "Add more songs" : "Choose songs from my device"}
            </button>
            {music.tracks.length > 0 && (
              <>
                <button type="button" onClick={prev} className="btn-crayon" aria-label="Previous song">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleMusic}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-secondary px-5 py-2 font-extrabold text-secondary-foreground"
                >
                  {music.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {music.playing ? "Pause" : "Play"}
                </button>
                <button type="button" onClick={next} className="btn-crayon" aria-label="Next song">
                  <SkipForward className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {music.tracks.length === 0 ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Pick any music files stored on your device to build a playlist.
            </p>
          ) : (
            <>
              <label className="mt-5 flex items-center gap-3 text-sm font-bold">
                <Volume2 className="h-4 w-4" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={music.volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Music volume"
                />
              </label>
              <ul className="mt-4 space-y-2">
                {music.tracks.map((track, i) => (
                  <li
                    key={track.id}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border-2 border-border px-3 py-2",
                      i === music.index && "bg-secondary/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => playTrack(i)}
                      className="min-w-0 flex-1 truncate text-left text-sm font-bold"
                    >
                      {track.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTrack(track.id)}
                      className="text-muted-foreground hover:text-primary"
                      aria-label={`Remove ${track.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
