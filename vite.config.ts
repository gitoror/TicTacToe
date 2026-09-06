import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  base:
    process.env.GITHUB_PAGES === "true"
      ? `${(process.env.PAGES_BASE_PATH || "").replace(/\/$/, "")}/`
      : "/",
  define: {
    "import.meta.env.VITE_STATIC_PAGES": JSON.stringify(
      process.env.GITHUB_PAGES === "true"
    ),
  },
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
})
