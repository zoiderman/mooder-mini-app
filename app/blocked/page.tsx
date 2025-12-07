"use client";

import { useEffect, useState } from "react";

type Track = {
  id: string;
  title: string;
  artist: string;
  mood: string;
};

const buildSpotifyEmbedUrl = (id: string) =>
  `https://open.spotify.com/embed/track/${id}?utm_source=generator`;

export default function SkippedTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    const blocked = localStorage.getItem("blockedTracks");
    if (blocked) {
      try {
        setTracks(JSON.parse(blocked));
      } catch {
        setTracks([]);
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <header className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold">Skipped tracks</h1>
          <a
            href="/quiz"
            className="text-xs text-white/70 hover:text-white underline"
          >
            Back to mooder
          </a>
        </header>

        {tracks.length === 0 ? (
          <p className="text-sm text-white/60">
            You haven&apos;t skipped any tracks yet.
          </p>
        ) : (
          <div className="space-y-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm space-y-2"
              >
                <div className="font-semibold">{track.title}</div>
                <div className="text-white/70">{track.artist}</div>
                <div className="text-xs text-white/50">{track.mood}</div>
                <div className="mt-2">
                  <iframe
                    src={buildSpotifyEmbedUrl(track.id)}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={`Spotify player for ${track.title}`}
                    className="w-full rounded-lg border border-white/20"
                  ></iframe>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
