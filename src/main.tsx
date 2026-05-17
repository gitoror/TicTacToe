import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { RouterApplication } from "./provider/router.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterApplication />
  </StrictMode>
)
