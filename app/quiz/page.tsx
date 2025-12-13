"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

type MoodLevel = "Low" | "Medium" | "High";
type Tone = "Happy" | "Sad" | "Angry" | "Calm";
type Context = "Alone" | "In pair" | "With company";

type GenreOption =
  | "Electronic"
  | "Techno"
  | "House"
  | "Drum & Bass"
  | "Hip-Hop"
  | "Pop"
  | "Rock"
  | "Classical"
  | "Instrumental"
  | "Ambient"
  | "Jazz"
  | "Metal";

type EraOption = "Any" | "1980s" | "1990s" | "2000s" | "2010s" | "2020s";

type Track = {
  id: string;
  title: string;
  artist: string;
};

const ALL_GENRES: GenreOption[] = [
  "Electronic",
  "Techno",
  "House",
  "Drum & Bass",
  "Hip-Hop",
  "Pop",
  "Rock",
  "Classical",
  "Instrumental",
  "Ambient",
  "Jazz",
  "Metal",
];

const ALL_ERAS: EraOption[] = [
  "Any",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
];

const buildSpotifyEmbedUrl = (id: string) =>
  `https://open.spotify.com/embed/track/${id}?utm_source=generator`;

export default function QuizPage() {
  const { data: session, status } = useSession();

  const [blockedTracks, setBlockedTracks] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playedTrackIds, setPlayedTrackIds] = useState<string[]>([]);

  const [moodLevel, setMoodLevel] = useState<MoodLevel>("Medium");
  const [tone, setTone] = useState<Tone>("Happy");
  const [context, setContext] = useState<Context>("Alone");
  const [note, setNote] = useState("");

  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [era, setEra] = useState<EraOption>("Any");

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "like" | "dislike";
  } | null>(null);

  useEffect(() => {
    const liked = localStorage.getItem("likedTracks");
    const blocked = localStorage.getItem("blockedTracks");
    const played = localStorage.getItem("playedTrackIds");

    if (liked) setLikedTracks(JSON.parse(liked));
    if (blocked) setBlockedTracks(JSON.parse(blocked));
    if (played) setPlayedTrackIds(JSON.parse(played));
  }, []);

  const showToast = (message: string, type: "like" | "dislike") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const likeTrack = (track: Track) => {
    if (likedTracks.some((t) => t.id === track.id)) {
      showToast("Already in favorites", "like");
      return;
    }

    const updated = [...likedTracks, track];
    setLikedTracks(updated);
    localStorage.setItem("likedTracks", JSON.stringify(updated));

    const cleanedBlocked = blockedTracks.filter((t) => t.id !== track.id);
    setBlockedTracks(cleanedBlocked);
    localStorage.setItem("blockedTracks", JSON.stringify(cleanedBlocked));

    showToast("Added to favorites", "like");
  };

  const dislikeTrack = (track: Track) => {
    if (blockedTracks.some((t) => t.id === track.id)) {
      showToast("Already in skipped tracks", "dislike");
      return;
    }

    const updated = [...blockedTracks, track];
    setBlockedTracks(updated);
    localStorage.setItem("blockedTracks", JSON.stringify(updated));

    const cleanedLiked = likedTracks.filter((t) => t.id !== track.id);
    setLikedTracks(cleanedLiked);
    localStorage.setItem("likedTracks", JSON.stringify(cleanedLiked));

    showToast("Added to skipped tracks", "dislike");
  };

  const toggleGenre = (g: GenreOption) => {
    setGenres((prev) => {
      if (prev.includes(g)) return prev.filter((x) => x !== g);
      return [...prev, g];
    });
  };

  const pickTrack = async () => {
    setIsLoading(true);

    try {
      const excludeTrackIds = [
        ...playedTrackIds,
        ...blockedTracks.map((t) => t.id),
      ];

      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodLevel,
          tone,
          context,
          note,
          genres,
          era,
          excludeTrackIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as any).error || "Failed to get recommendation";
        showToast(msg, "dislike");
        setSelectedTrack(null);
        return;
      }

      const data = (await res.json()) as Track;

      setSelectedTrack(data);

      setPlayedTrackIds((prev) => {
        if (prev.includes(data.id)) return prev;
        const updated = [...prev, data.id];
        localStorage.setItem("playedTrackIds", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error(err);
      showToast("Error talking to AI or Spotify", "dislike");
      setSelectedTrack(null);
    } finally {
      setIsLoading(false);
    }
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFiltersOpen((v) => !v)}
              className="px-2 py-1 rounded-md border border-white/25 hover:bg-white/10 text-[11px] transition"
            >
              Filters
            </button>

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
        </div>

        {isFiltersOpen && (
          <div className="mt-2 rounded-2xl border border-white/20 bg-black/90 p-3 text-xs space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-white/60 mb-1">
              <span className="font-semibold">Filters</span>
              <button
                type="button"
                className="text-white/60 hover:text-white underline"
                onClick={() => setIsFiltersOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-white/70">
                Favorite genres (multi-select)
              </div>
              <div className="flex flex-wrap gap-1">
                {ALL_GENRES.map((g) => {
                  const selected = genres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      className={`px-2 py-1 rounded-full border text-[11px] ${
                        selected
                          ? "border-white bg-white/15"
                          : "border-white/25"
                      }`}
                      onClick={() => toggleGenre(g)}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 rounded-md border border-white/25 hover:bg-white/10 text-[11px]"
                  onClick={() => setGenres([])}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-white/70">Era</div>
              <div className="flex flex-wrap gap-1">
                {ALL_ERAS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`px-2 py-1 rounded-full border text-[11px] ${
                      era === e
                        ? "border-white bg-white/15"
                        : "border-white/25"
                    }`}
                    onClick={() => setEra(e as EraOption)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
              <div className="space-y-2">
                <div className="font-semibold text-white">Favorites</div>
                <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                  {likedTracks.length === 0 ? (
                    <p className="text-white/50 text-[11px]">
                      No favorites yet.
                    </p>
                  ) : (
                    likedTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => {
                          setSelectedTrack(track);
                          setIsPanelOpen(false);
                        }}
                        className="w-full text-left rounded-lg border border-white/15 bg-white/5 p-2 space-y-1 hover:bg-white/10 transition cursor-pointer"
                      >
                        <div className="text-[11px] font-semibold">
                          {track.title}
                        </div>
                        <div className="text-[11px] text-white/70">
                          {track.artist}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">Skipped tracks</div>
                <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                  {blockedTracks.length === 0 ? (
                    <p className="text-white/50 text-[11px]">
                      No skipped tracks.
                    </p>
                  ) : (
                    blockedTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => {
                          setSelectedTrack(track);
                          setIsPanelOpen(false);
                        }}
                        className="w-full text-left rounded-lg border border-white/15 bg-white/5 p-2 space-y-1 hover:bg-white/10 transition cursor-pointer"
                      >
                        <div className="text-[11px] font-semibold">
                          {track.title}
                        </div>
                        <div className="text-[11px] text-white/70">
                          {track.artist}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-semibold text-center">mooder</h1>
        <p className="text-sm text-center text-white/70">
          Answer a few questions — I&apos;ll pick a track that matches your
          vibe.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current mood level?</label>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {["Low", "Medium", "High"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`rounded-lg border px-2 py-2 transition active:scale-95 ${
                    moodLevel === lvl
                      ? "border-white bg-white/10"
                      : "border-white/20"
                  }`}
                  onClick={() => setMoodLevel(lvl as MoodLevel)}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">What&apos;s the vibe?</label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {["Happy", "Sad", "Angry", "Calm"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`rounded-lg border px-2 py-2 transition active:scale-95 ${
                    tone === t ? "border-white bg-white/10" : "border-white/20"
                  }`}
                  onClick={() => setTone(t as Tone)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Who are you with?</label>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {["Alone", "In pair", "With company"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`rounded-lg border px-2 py-2 transition active:scale-95 ${
                    context === c
                      ? "border-white bg-white/10"
                      : "border-white/20"
                  }`}
                  onClick={() => setContext(c as Context)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Add details (any language)
            </label>
            <textarea
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white"
              rows={2}
              placeholder='Example: "Я дуже втомлений після роботи, хочу музику для відпочинку"'
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={pickTrack}
            className="w-full rounded-lg bg-white text-black py-2 text-sm font-semibold disabled:bg-white/40 transition active:scale-95"
            disabled={isLoading}
          >
            {isLoading
              ? "Picking a track..."
              : selectedTrack
              ? "Next track"
              : "Pick a track"}
          </button>
        </div>

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
