import { copyFile, mkdir, readFile, stat } from "node:fs/promises"
import { resolve, relative, isAbsolute } from "node:path"

// React Router prerenders under basename. Pages already mounts the artifact at
// that basename, so place the HTML at the artifact root, beside the assets.
const client = resolve("build/client")
const base = (process.env.PAGES_BASE_PATH || "").replace(/^\/+|\/+$/g, "")
const rendered = resolve(client, base)
const within = relative(client, rendered)
if (within.startsWith("..") || isAbsolute(within))
  throw new Error("Invalid Pages base path")

for (const page of ["index.html", "tictactoe/index.html"]) {
  const source = resolve(rendered, page)
  const target = resolve(client, page)
  if (source !== target) {
    await mkdir(resolve(target, ".."), { recursive: true })
    await copyFile(source, target)
  }
  const html = await readFile(target, "utf8")
  if (!html.includes("Nine squares."))
    throw new Error(`Missing prerendered game in ${page}`)
  const prefix = `/${base ? `${base}/` : ""}`
  const assets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith(prefix + "assets/"))
  if (!assets.length)
    throw new Error(`Missing assets with Pages prefix ${prefix} in ${page}`)
  for (const asset of assets)
    await stat(resolve(client, asset.slice(prefix.length)))
  console.log(`Verified ${page} and ${assets.length} asset references`)
}
