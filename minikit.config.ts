const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  miniapp: {
    version: "1",
    name: "mooder",
    subtitle: "Pick a song for your mood",
    description:
      "Mini app that asks a few questions about your mood and suggests a Spotify track.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["music", "mood", "spotify", "ai"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Let your mood choose the track",
    ogTitle: "mooder — mood-based music picker",
    ogDescription: "Answer a few questions, get a track suggestion.",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;
