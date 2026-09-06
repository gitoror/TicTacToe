import type { Config } from "@react-router/dev/config"

const githubPages = process.env.GITHUB_PAGES === "true"

export default {
  // Pages hosts static files; the default build keeps the online room server.
  ssr: !githubPages,
  prerender: githubPages,
  basename: githubPages ? process.env.PAGES_BASE_PATH || "/" : "/",
} satisfies Config
