import type { Route } from "./+types/home"
import Nought from "../components/tictactoe/Nought"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "nought. — A little play. A sharper mind." },
    {
      name: "description",
      content:
        "Master tic tac toe with a perfect-play coach, local multiplayer, and private online rooms.",
    },
  ]
}

export default function Home() {
  return <Nought />
}
