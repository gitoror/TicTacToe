import { useMemo, useState } from "react"
import { BasicButton } from "../../components/buttons/basic-button/BasicButton"
import { Board } from "../../components/tictactoe/board/Board"
import { History } from "../../components/tictactoe/history/History"
import "./TicTacToe.css"

type Player = "X" | "O"
export type HistoryEntry = {
  player: Player
  position: [number, number]
}

export const TicTacToe = () => {
  const [player, setPlayer] = useState<Player>("X")
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [squares, setSquares] = useState<string[]>(createEmptySquares())

  const gameResult = useMemo(() => calculateWinner(squares), [squares])
  const winner = gameResult && gameResult !== "Tie" ? gameResult : null
  const isTie = gameResult === "Tie"

  const updateSquare = (i: number) => {
    const newSquares = [...squares]
    newSquares[i] = player
    setSquares(newSquares)
  }

  const updateHistory = (i: number) => {
    const [row, col] = mapIndexToPosition(i)
    const newEntry: HistoryEntry = { player: player, position: [row, col] }
    setHistory([...history, newEntry])
  }

  const play = (i: number) => {
    const squareIsFilled = squares[i] !== null

    if (squareIsFilled || winner || isTie) {
      return
    }

    updateSquare(i)
    updateHistory(i)
    setPlayer(player === "X" ? "O" : "X")
  }

  const resetGame = () => {
    setSquares(createEmptySquares())
    setHistory([])
    setPlayer("X")
  }

  return (
    <>
      <h1>Tic Tac Toe</h1>

      <div className="tictactoe">
        <div>
          <Status winner={winner} isTie={isTie} nextPlayer={player} />
          <Board squares={squares} onPlay={play} />
          <BasicButton
            className="reset-button"
            size="large"
            onClick={resetGame}
          >
            Reset Game
          </BasicButton>
        </div>
        <div>
          <h2>Move History</h2>
          <History history={history} />
        </div>
      </div>
    </>
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

const mapIndexToPosition = (index: number): [number, number] => {
  const row = Math.floor(index / 3)
  const col = index % 3
  return [row, col]
}
