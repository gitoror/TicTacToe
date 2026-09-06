import type { Route } from "./+types/home"
import Game from "~/components/tictactoe/Nought"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tic Tac Toe" },
    { name: "description", content: "Play Tic Tac Toe!" },
  ]
}

export default function TicTacToe() {
  return <Game />
}
