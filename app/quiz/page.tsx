"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import tracksData from "@/data/tracks.json";

type MoodLevel = "Low" | "Medium" | "High";
type Tone = "Happy" | "Sad" | "Angry" | "Calm";
type Context = "Alone" | "With friends";

type Track = {
  id: string;
  title: string;
  artist: string;
  mood: string;
};

const MOOD_LEVELS: MoodLevel[] = ["Low", "Medium", "High"];
const TONES: Tone[] = ["Happy", "Sad", "Angry", "Calm"];
const CONTEXTS: Context[] = ["Alone", "With friends"];

const STORAGE_KEYS = {
  liked: "likedTracks",
  blocked: "blockedTracks",
};

const tracks = tracksData as Track[];

const buildSpotifyEmbedUrl = (id: string) =>
  `https://open.spotify.com/embed/track/${id}?utm_source=generator`;

type OptionGroupProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onSelect: (val: T) => void;
};

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
}: OptionGroupProps<T>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div
        className={`grid ${
          options.length === 3 ? "grid-cols-3" : "grid-cols-2"
        } gap-2 text-sm`}
      >
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`rounded-lg border px-2 py-2 transition active:scale-95 ${
              value === opt ? "border-white bg-white/10" : "border-white/20"
            }`}
            onClick={() => onSelect(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

type TrackListProps = {
  title: string;
  tracks: Track[];
  onSelect: (track: Track) => void;
  emptyText: string;
};

function TrackList({ title, tracks, onSelect, emptyText }: TrackListProps) {
  return (
    <div className="space-y-2">
      <div className="font-semibold text-white">{title}</div>
      <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
        {tracks.length === 0 ? (
          <p className="text-white/50 text-[11px]">{emptyText}</p>
        ) : (
          tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => onSelect(track)}
              className="w-full text-left rounded-lg border border-white/15 bg-white/5 p-2 space-y-1 hover:bg-white/10 transition cursor-pointer"
            >
              <div className="text-[11px] font-semibold">{track.title}</div>
              <div className="text-[11px] text-white/70">{track.artist}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { data: session, status } = useSession();

  const [blockedTracks, setBlockedTracks] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [moodLevel, setMoodLevel] = useState<MoodLevel>("Medium");
  const [tone, setTone] = useState<Tone>("Happy");
  const [context, setContext] = useState<Context>("With friends");
  const [note, setNote] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "like" | "dislike";
  } | null>(null);

  useEffect(() => {
    const liked = localStorage.getItem(STORAGE_KEYS.liked);
    const blocked = localStorage.getItem(STORAGE_KEYS.blocked);

    if (liked) setLikedTracks(JSON.parse(liked));
    if (blocked) setBlockedTracks(JSON.parse(blocked));
  }, []);

  const showToast = (message: string, type: "like" | "dislike") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const syncLists = (liked: Track[], blocked: Track[]) => {
    setLikedTracks(liked);
    setBlockedTracks(blocked);
    localStorage.setItem(STORAGE_KEYS.liked, JSON.stringify(liked));
    localStorage.setItem(STORAGE_KEYS.blocked, JSON.stringify(blocked));
  };

  const likeTrack = (track: Track) => {
    if (likedTracks.some((t) => t.id === track.id)) {
      showToast("Already in favorites", "like");
      return;
    }

    const updatedLiked = [...likedTracks, track];
    const cleanedBlocked = blockedTracks.filter((t) => t.id !== track.id);
    syncLists(updatedLiked, cleanedBlocked);
    showToast("Added to favorites", "like");
  };

  const dislikeTrack = (track: Track) => {
    if (blockedTracks.some((t) => t.id === track.id)) {
      showToast("Already in skipped tracks", "dislike");
      return;
    }

    const updatedBlocked = [...blockedTracks, track];
    const cleanedLiked = likedTracks.filter((t) => t.id !== track.id);
    syncLists(cleanedLiked, updatedBlocked);
    showToast("Added to skipped tracks", "dislike");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const filteredTracks = tracks.filter(
      (track) => !blockedTracks.some((b) => b.id === track.id)
    );

    if (!filteredTracks.length) {
      setSelectedTrack(null);
      setIsLoading(false);
      showToast("No tracks available (all skipped)", "dislike");
      return;
    }

    const targetMoodParts = [moodLevel, tone, context].filter(Boolean);

    const scored = filteredTracks.map((track) => {
      const parts = track.mood.split(",").map((p) => p.trim());
      const score = targetMoodParts.reduce(
        (acc, part) => (parts.includes(part) ? acc + 1 : acc),
        0
      );
      return { track, score };
    });

    const bestScore = Math.max(...scored.map((s) => s.score));
    const candidates = scored.filter((s) => s.score === bestScore);
    const picked = candidates[Math.floor(Math.random() * candidates.length)]
      .track;

    setTimeout(() => {
      setSelectedTrack(picked);
      setIsLoading(false);
    }, 300);
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white p-4">
        <h1 className="text-3xl font-bold mb-4 text-center">mooder</h1>
        <p className="mb-6 text-center max-w-md text-white/80">
          To get a personalized track suggestion, sign in with Spotify.
        </p>

        <button
          onClick={() => signIn("spotify")}
          className="px-10 py-4 bg-green-500 hover:bg-green-600 rounded-full text-xl font-bold flex items-center gap-3 active:scale-95 transition"
        >
          Sign in with Spotify
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-30 rounded-lg px-4 py-2 text-sm shadow-lg border ${
            toast.type === "like"
              ? "bg-emerald-600/90 border-emerald-400"
              : "bg-red-600/90 border-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-5 space-y-5">
        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
          <span className="font-semibold tracking-wide">mooder</span>
          {isPanelOpen ? (
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="px-2 py-1 rounded-md border border-white/30 hover:bg-white/10 transition text-[11px]"
            >
              Close library
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsPanelOpen(true)}
              className="flex flex-col gap-[3px] px-2 py-1 rounded-md border border-white/20 hover:border-white/60 hover:bg-white/10 transition active:scale-95"
              aria-label="Open favorites and skipped tracks"
            >
              <span className="h-[2px] w-4 bg-white/80 rounded-full" />
              <span className="h-[2px] w-4 bg-white/80 rounded-full" />
              <span className="h-[2px] w-4 bg-white/80 rounded-full" />
            </button>
          )}
        </div>

        {isPanelOpen && (
          <div className="mt-3 rounded-2xl border border-white/20 bg-black/90 p-3 text-xs space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-white/60">
              <span className="font-semibold">Library</span>
              <button
                type="button"
                className="text-white/60 hover:text-white underline"
                onClick={() => setIsPanelOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TrackList
                title="Favorites"
                tracks={likedTracks}
                onSelect={(track) => {
                  setSelectedTrack(track);
                  setIsPanelOpen(false);
                }}
                emptyText="No favorites yet."
              />
              <TrackList
                title="Skipped tracks"
                tracks={blockedTracks}
                onSelect={(track) => {
                  setSelectedTrack(track);
                  setIsPanelOpen(false);
                }}
                emptyText="No skipped tracks."
              />
            </div>
          </div>
        )}

        <h1 className="text-2xl font-semibold text-center">mooder</h1>
        <p className="text-sm text-center text-white/70">
          Answer a few questions - I&apos;ll pick a track that matches your vibe.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <OptionGroup
            label="Current mood level?"
            options={MOOD_LEVELS}
            value={moodLevel}
            onSelect={(val) => setMoodLevel(val as MoodLevel)}
          />

          <OptionGroup
            label="What&apos;s the vibe?"
            options={TONES}
            value={tone}
            onSelect={(val) => setTone(val as Tone)}
          />

          <OptionGroup
            label="Are you alone or with someone?"
            options={CONTEXTS}
            value={context}
            onSelect={(val) => setContext(val as Context)}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Want to add a detail (situation / vibe)?
            </label>
            <textarea
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white"
              rows={2}
              placeholder="Example: night drive, workout, work, thinking..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-white text-black py-2 text-sm font-semibold disabled:bg-white/40 transition active:scale-95"
            disabled={isLoading}
          >
            {isLoading ? "Picking a track..." : "Pick a track"}
          </button>
        </form>

        {selectedTrack && (
          <div className="mt-4 space-y-2 rounded-xl border border-white/15 bg-white/5 p-3 text-sm">
            <div className="text-xs uppercase text-white/60">Your track</div>
            <div className="font-semibold">{selectedTrack.title}</div>
            <div className="text-white/70">{selectedTrack.artist}</div>

            <div className="mt-3">
              <iframe
                src={buildSpotifyEmbedUrl(selectedTrack.id)}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={`Spotify player for ${selectedTrack.title}`}
                className="w-full rounded-lg border border-white/20"
              ></iframe>

              <div className="flex gap-3 mt-3">
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition active:scale-95"
                  onClick={() => likeTrack(selectedTrack)}
                >
                  Like
                </button>

                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition active:scale-95"
                  onClick={() => dislikeTrack(selectedTrack)}
                >
                  Dislike
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
