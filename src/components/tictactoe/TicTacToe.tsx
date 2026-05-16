/** @jsxImportSource @emotion/react */
import { useMemo, useState } from "react"
import { BasicButton } from "../buttons/basic-button/BasicButton"
import { Board } from "./board/Board"
import "./TicTacToe.css"

type Player = "X" | "O"

export const TicTacToe = () => {
  const [nextPlayer, setNextPlayer] = useState<Player>("X")
  const [squares, setSquares] = useState<string[]>(createEmptySquares())

  const gameResult = useMemo(() => calculateWinner(squares), [squares])
  const winner = gameResult && gameResult !== "Tie" ? gameResult : null
  const isTie = gameResult === "Tie"

  const play = (i: number) => {
    const squareIsFilled = squares[i] !== null

    if (squareIsFilled || winner || isTie) {
      return
    }

    const newSquares = [...squares]
    newSquares[i] = nextPlayer
    setSquares(newSquares)
    setNextPlayer(nextPlayer === "X" ? "O" : "X")
  }

  const resetGame = () => {
    setSquares(createEmptySquares())
    setNextPlayer("X")
  }

  return (
    <div>
      <h1>Tic Tac Toe</h1>
      <Status winner={winner} isTie={isTie} nextPlayer={nextPlayer} />
      <Board squares={squares} updateSquare={play} />
      <BasicButton size="large" onClick={resetGame}>
        Reset Game
      </BasicButton>
    </div>
  )
}

type StatusProps = {
  winner: Player | null
  isTie: boolean
  nextPlayer: Player
}

const Status = ({ winner, isTie, nextPlayer }: StatusProps) => {
  if (winner) {
    return <h2>Winner: {winner}</h2>
  }
  if (isTie) {
    return <h2>It's a Tie!</h2>
  }
  return <h2>Next player: {nextPlayer}</h2>
}

const createEmptySquares = () => Array(9).fill(null)

const calculateWinner = (squares: string[]): Player | "Tie" | null => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a] as Player
    }
  }

  // Tie condition: if there are no null squares and no winner, it's a tie
  const isBoardFull = squares.every((square) => square !== null)
  if (isBoardFull) {
    return "Tie"
  }

  return null
}
