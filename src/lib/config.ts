export const appConfig = {
  name: "OneBook",
  tagline: "Stay close to people who matter.",
  description:
    "OneBook is a modern social network for sharing posts, stories, reels, and conversations.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@onebook.app",
} as const;
