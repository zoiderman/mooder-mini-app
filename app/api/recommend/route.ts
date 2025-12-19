export const runtime = "nodejs";

import { NextResponse } from "next/server";

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
  | "Metal"
  | "Chill";

type EraOption = "Any" | "1980s" | "1990s" | "2000s" | "2010s" | "2020s";

type ContextOption = "Alone" | "In pair" | "With company";

type SpotifyArtist = { name?: string };
type SpotifyAlbum = { name?: string; release_date?: string };

type SpotifyTrack = {
  id: string;
  name?: string;
  popularity?: number;
  artists?: SpotifyArtist[];
  album?: SpotifyAlbum;
  external_urls?: { spotify?: string };
};

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "mixtral-8x7b-32768";

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token error: ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function matchEra(year: number | null, era: EraOption): boolean {
  if (!year || era === "Any") return true;

  switch (era) {
    case "1980s":
      return year >= 1980 && year <= 1989;
    case "1990s":
      return year >= 1990 && year <= 1999;
    case "2000s":
      return year >= 2000 && year <= 2009;
    case "2010s":
      return year >= 2010 && year <= 2019;
    case "2020s":
      return year >= 2020 && year <= 2029;
    default:
      return true;
  }
}

function shouldBlockRussian(text?: string) {
  if (!text) return false;
  const t = text.toLowerCase();

  const blockedTokens = [
    "russian",
    "\u0440\u043e\u0441\u0441\u0438",
    "\u0440\u043e\u0441\u0456\u0439",
    "\u0440\u043e\u0441\u0456\u044f",
    "\u043c\u043e\u0441\u043a\u0432",
  ];

  return blockedTokens.some((kw) => t.includes(kw));
}

function filterOutRussianTracks(items: SpotifyTrack[]) {
  return items.filter((item) => {
    const name = item?.name;
    if (shouldBlockRussian(name)) return false;

    const albumName = item?.album?.name;
    if (shouldBlockRussian(albumName)) return false;

    const artists: SpotifyArtist[] = item?.artists || [];
    for (const a of artists) {
      if (shouldBlockRussian(a?.name)) return false;
    }

    return true;
  });
}

// UA intent: ONLY explicit request words, not "any Ukrainian language"
function isExplicitUkrainianRequest(note?: string) {
  const t = (note || "").toLowerCase();
  return (
    t.includes("ukrain") ||
    t.includes(" ukr") ||
    t.includes("ukr ") ||
    t.includes("ua rap") ||
    t.includes("ua hip") ||
    t.includes("\u0443\u043a\u0440\u0430\u0457\u043d") ||
    t.includes("\u0443\u043a\u0440") ||
    t.includes("\u0443\u043a\u0440\u0430\u0457") ||
    t.includes("\u0443\u043a\u0440\u0430\u0457\u043d\u0441") ||
    t.includes("\u0443\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a")
  );
}

function isExplicitAmericanRequest(note?: string) {
  const t = (note || "").toLowerCase();
  const keywords = [
    "american",
    "us rap",
    "usa",
    "wu-tang",
    "wu tang",
    "90s hip hop",
    "east coast",
    "west coast",
    "\u0430\u043c\u0435\u0440\u0438\u043a\u0430\u043d",
    "\u0448\u0442\u0430\u0442\u0438",
    "\u0441\u0448\u0430",
    "\u0432\u0443-\u0442\u0435\u043d\u0433",
    "\u0432\u0443 \u0442\u0435\u043d\u0433",
  ];

  return keywords.some((kw) => t.includes(kw));
}

function inferEraFromNote(note?: string): EraOption | null {
  const t = (note || "").toLowerCase();

  const eraPatterns: Array<{ era: EraOption; patterns: RegExp[] }> = [
    {
      era: "1980s",
      patterns: [
        /\b80s\b/,
        /\b1980s?\b/,
        /\b198\d\b/,
        /\b80-\u0445\b/,
        /\b80\u0445\b/,
      ],
    },
    {
      era: "1990s",
      patterns: [
        /\b90s\b/,
        /\b1990s?\b/,
        /\b199\d\b/,
        /\b90-\u0445\b/,
        /\b90\u0445\b/,
      ],
    },
    {
      era: "2000s",
      patterns: [
        /\b00s\b/,
        /\b2000s?\b/,
        /\b200\d\b/,
        /\b00-\u0445\b/,
        /\b00\u0445\b/,
        /\b2000-\u0445\b/,
        /\b2000\u0445\b/,
      ],
    },
    {
      era: "2010s",
      patterns: [
        /\b2010s?\b/,
        /\b201\d\b/,
        /\b2010-\u0445\b/,
        /\b2010\u0445\b/,
      ],
    },
    {
      era: "2020s",
      patterns: [
        /\b2020s?\b/,
        /\b202\d\b/,
        /\b2020-\u0445\b/,
        /\b2020\u0445\b/,
      ],
    },
  ];

  for (const { era, patterns } of eraPatterns) {
    if (patterns.some((p) => p.test(t))) return era;
  }

  return null;
}

function isForbiddenGroqQuery(query: string) {
  const t = query.toLowerCase();
  const forbiddenTokens = [
    "russian",
    "\u0440\u043e\u0441\u0441\u0438\u044f",
    "\u0440\u043e\u0441\u0441\u0438",
    "\u0440\u043e\u0441\u0456\u0439",
    "\u0440\u043e\u0441\u0456\u044f",
    "moscow",
    "\u043c\u043e\u0441\u043a\u0432",
  ];
  return forbiddenTokens.some((kw) => t.includes(kw));
}

function gatherText(item: SpotifyTrack) {
  const parts: string[] = [];
  if (item?.name) parts.push(String(item.name));
  if (item?.album?.name) parts.push(String(item.album.name));
  for (const a of item?.artists || []) {
    if (a?.name) parts.push(String(a.name));
  }
  return parts.join(" ").toLowerCase();
}

function uaSignalScore(item: SpotifyTrack) {
  const text = gatherText(item);

  let score = 0;
  if (text.includes("ukrain")) score += 6;
  if (text.includes("\u0443\u043a\u0440\u0430\u0457\u043d")) score += 6;
  if (/[\u0456\u0457\u0491]/u.test(text)) score += 3;

  return score;
}

// Genre score makes genre always the top priority
function genreScore(item: SpotifyTrack, genres: GenreOption[]) {
  const text = gatherText(item);
  let score = 0;

  const has = (kw: string) => text.includes(kw);

  for (const g of genres) {
    switch (g) {
      case "Classical":
        if (has("classical")) score += 10;
        if (has("piano")) score += 6;
        if (has("orchestra")) score += 6;
        if (has("symphony")) score += 6;
        if (has("concerto")) score += 6;
        if (has("instrumental")) score += 4;
        break;

      case "Chill":
        if (has("chill")) score += 10;
        if (has("relax")) score += 8;
        if (has("lofi") || has("lo-fi")) score += 7;
        if (has("ambient")) score += 5;
        if (has("downtempo")) score += 5;
        break;

      case "Instrumental":
        if (has("instrumental")) score += 8;
        if (has("piano")) score += 4;
        break;

      case "Ambient":
        if (has("ambient")) score += 9;
        break;

      case "Hip-Hop":
        if (has("hip hop") || has("hip-hop")) score += 9;
        if (has("rap")) score += 7;
        break;

      case "Drum & Bass":
        if (has("drum and bass") || has("drum & bass") || has("dnb"))
          score += 9;
        if (has("liquid")) score += 5;
        break;

      case "Techno":
        if (has("techno")) score += 9;
        break;

      case "House":
        if (has("house")) score += 9;
        break;

      case "Electronic":
        if (has("electronic")) score += 7;
        if (has("edm")) score += 5;
        break;

      case "Rock":
        if (has("rock")) score += 8;
        break;

      case "Pop":
        if (has("pop")) score += 7;
        break;

      case "Jazz":
        if (has("jazz")) score += 9;
        break;

      case "Metal":
        if (has("metal")) score += 9;
        break;
    }
  }

  return score;
}

function buildFallbackQuery(params: {
  moodLevel: string;
  tone: string;
  context: ContextOption;
  note: string;
  genres: GenreOption[];
  effectiveEra: EraOption;
  uaRequested: boolean;
  americanRequested: boolean;
}) {
  const parts: string[] = [];

  // Put genre hints first (genre priority)
  for (const g of params.genres || []) {
    switch (g) {
      case "Classical":
        parts.push("classical piano orchestra");
        break;
      case "Chill":
        parts.push("chill relax");
        break;
      case "Instrumental":
        parts.push("instrumental");
        break;
      case "Ambient":
        parts.push("ambient");
        break;
      case "Jazz":
        parts.push("jazz");
        break;
      case "Metal":
        parts.push("metal");
        break;
      case "Hip-Hop":
        parts.push("hip hop rap");
        break;
      case "Drum & Bass":
        parts.push("drum and bass dnb");
        break;
      case "Techno":
        parts.push("techno");
        break;
      case "House":
        parts.push("house");
        break;
      case "Electronic":
        parts.push("electronic");
        break;
      case "Pop":
        parts.push("pop");
        break;
      case "Rock":
        parts.push("rock");
        break;
    }
  }

  if (params.americanRequested) parts.push("american us");
  if (params.uaRequested) parts.push("ukrainian ua");

  if (params.note) parts.push(params.note.toLowerCase());

  parts.push(params.tone.toLowerCase());
  parts.push(params.moodLevel.toLowerCase());

  if (params.context === "In pair") parts.push("romantic");
  else if (params.context === "With company") parts.push("party");
  else parts.push("solo");

  if (params.effectiveEra !== "Any") parts.push(params.effectiveEra.toLowerCase());

  const query = parts.join(" ").trim();
  return query || "chill music";
}

async function getGroqQuery(input: {
  moodLevel: string;
  tone: string;
  context: ContextOption;
  note: string;
  genres: GenreOption[];
  era: EraOption;
  uaRequested: boolean;
  americanRequested: boolean;
  inferredEra: EraOption | null;
  effectiveEra: EraOption;
}) {
  if (!GROQ_API_KEY) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: [
              "You build Spotify search queries for music recommendations.",
              "- The user's note may be in ANY language. Interpret it.",
              "- Genre selection from the UI is the top priority. Never override it. If no genres are provided, infer a reasonable genre/era from the note.",
              "- Ukrainian language alone does NOT mean the user wants Ukrainian music. Only prioritize Ukrainian artists/tracks if the explicit Ukrainian request flag is true.",
              "- If the explicit American/US intent flag is true, favor American/US results and do not bias toward Ukrainian unless the Ukrainian request flag is also true.",
              "- Detect and use era hints in the note (80s/90s/00s/2010s/2020s) when the era is Any.",
              "- Do NOT produce Russian-language or Russia-related results.",
              "- Use mood level, tone, and context: Alone / In pair / With company.",
              "- Output ONLY a short plain text Spotify query (a few words). No quotes, no explanations.",
            ].join("\n"),
          },
          {
            role: "user",
            content: `
Mood level: ${input.moodLevel}
Tone: ${input.tone}
Context: ${input.context}
User note: ${input.note || "no extra details"}
Explicit Ukrainian request: ${input.uaRequested ? "yes" : "no"}
Explicit American request: ${input.americanRequested ? "yes" : "no"}
Preferred genres: ${(input.genres || []).join(", ") || "none"}
Preferred era: ${input.era}
Era hint from note: ${input.inferredEra || "none"}
Era to use (after hint): ${input.effectiveEra}
            `.trim(),
          },
        ],
        temperature: 0.25,
        max_tokens: 60,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("Groq API error:", text);
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content || content.length < 3) return null;

    const cleaned = content.replace(/["'\n\r]+/g, " ").trim();
    if (!cleaned || cleaned.length < 3) return null;
    if (isForbiddenGroqQuery(cleaned)) return null;

    return cleaned;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Groq request failed, using fallback:", msg);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      moodLevel: string;
      tone: string;
      context: ContextOption;
      note: string;
      genres: GenreOption[];
      era: EraOption;
      excludeTrackIds?: string[];
    };

    const { moodLevel, tone, context, note, genres, era, excludeTrackIds } =
      body;

    const excludeSet = new Set(excludeTrackIds || []);
    const selectedGenres = genres || [];

    const uaRequested = isExplicitUkrainianRequest(note);
    const americanRequested = isExplicitAmericanRequest(note);
    const inferredEra = inferEraFromNote(note);
    const effectiveEra = era === "Any" && inferredEra ? inferredEra : era;

    let query = buildFallbackQuery({
      moodLevel,
      tone,
      context,
      note,
      genres: selectedGenres,
      effectiveEra,
      uaRequested,
      americanRequested,
    });

    const groqQuery = await getGroqQuery({
      moodLevel,
      tone,
      context,
      note,
      genres: selectedGenres,
      era,
      uaRequested,
      americanRequested,
      inferredEra,
      effectiveEra,
    });
    if (groqQuery) query = groqQuery;

    const accessToken = await getSpotifyToken();

    const searchUrl = new URL("https://api.spotify.com/v1/search");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "track");
    searchUrl.searchParams.set("limit", "50");
    searchUrl.searchParams.set("market", "UA");

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchRes.ok) {
      const text = await searchRes.text();
      throw new Error(`Spotify search error: ${text}`);
    }

    const searchData = (await searchRes.json()) as {
      tracks?: { items?: SpotifyTrack[] };
    };

    let items: SpotifyTrack[] = searchData?.tracks?.items || [];

    if (!items.length) {
      return NextResponse.json(
        { error: "No tracks found for this mood" },
        { status: 404 }
      );
    }

    items = filterOutRussianTracks(items);

    if (!items.length) {
      return NextResponse.json(
        { error: "No non-russian tracks found for this query" },
        { status: 404 }
      );
    }

    const withEra = items.filter((item) => {
      const dateStr = item?.album?.release_date;
      const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : null;
      return matchEra(year, effectiveEra);
    });
    if (withEra.length) items = withEra;

    const uaWanted = uaRequested;

    // Rank: GENRE first, then UA only if explicitly requested, then popularity
    const ranked = [...items].sort((a, b) => {
      const ga = genreScore(a, selectedGenres);
      const gb = genreScore(b, selectedGenres);
      if (gb !== ga) return gb - ga;

      if (uaWanted) {
        const uaA = uaSignalScore(a);
        const uaB = uaSignalScore(b);
        if (uaB !== uaA) return uaB - uaA;
      }

      return (b.popularity ?? 0) - (a.popularity ?? 0);
    });

    let filtered = ranked.filter((t) => !excludeSet.has(t.id));
    if (!filtered.length) filtered = ranked;

    const top: SpotifyTrack[] = filtered.slice(0, 5);
    const picked = top[Math.floor(Math.random() * top.length)];

    const spotifyUrl =
      picked.external_urls?.spotify ||
      `https://open.spotify.com/track/${picked.id}`;

    const response: {
      id: string;
      title: string;
      artist: string;
      spotifyUrl?: string;
      youtubeVideoId?: string;
      soundcloudUrl?: string;
    } = {
      id: picked.id,
      title: picked.name || "Unknown title",
      artist: (picked.artists || [])
        .map((a) => a.name)
        .filter((v): v is string => Boolean(v))
        .join(", "),
      spotifyUrl,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Recommend API error:", msg);
    return NextResponse.json({ error: msg || "Internal error" }, { status: 500 });
  }
}
