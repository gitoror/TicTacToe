import { useEffect, useMemo, useState } from "react"
import { BasicButton } from "../../components/buttons/basic-button/BasicButton"
import { Board } from "../../components/tictactoe/board/Board"
import { History } from "../../components/tictactoe/history/History"
import "./TicTacToe.css"

type Player = "X" | "O"
type GameMode = "freeplay" | "online" | "pvc"
export type HistoryEntry = {
  player: Player
  position: [number, number]
}

const HUMAN_PLAYER: Player = "X"
const AI_PLAYER: Player = "O"

const createEmptySquares = (): (string | null)[] => Array(9).fill(null)

const calculateWinner = (squares: (string | null)[]): Player | "Tie" | null => {
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
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a] as Player
    }
  }
  return squares.every(Boolean) ? "Tie" : null
}

const mapIndexToPosition = (index: number): [number, number] => [
  Math.floor(index / 3),
  index % 3,
]

const calculateBestMove = (squares: (string | null)[]): number =>
  squares.findIndex((s) => s === null)

export const TicTacToe = () => {
  const [gameMode, setGameMode] = useState<GameMode>("freeplay")
  const [currentPlayer, setCurrentPlayer] = useState<Player>(HUMAN_PLAYER)
  const [squares, setSquares] = useState<(string | null)[]>(createEmptySquares)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [bestMoveIndex, setBestMoveIndex] = useState<number | null>(null)

  const gameResult = useMemo(() => calculateWinner(squares), [squares])
  const isGameOver = gameResult !== null
  const winner = gameResult !== "Tie" ? gameResult : null
  const isTie = gameResult === "Tie"

  const commitMove = (index: number, player: Player) => {
    setSquares((prev) => {
      const next = [...prev]
      next[index] = player
      return next
    })
    setHistory((prev) => [
      ...prev,
      { player, position: mapIndexToPosition(index) },
    ])
    setBestMoveIndex(null)
    setCurrentPlayer(player === "X" ? "O" : "X")
  }
  
  useEffect(() => {
    if (gameMode !== "pvc" || currentPlayer !== AI_PLAYER || isGameOver) return

    const timer = setTimeout(() => {
      const bestMove = calculateBestMove(squares)
      if (bestMove === -1) return
      commitMove(bestMove, AI_PLAYER)
    }, 400)

    return () => clearTimeout(timer)
  }, [currentPlayer, gameMode, isGameOver, squares])

  const handlePlay = (index: number) => {
    if (
      squares[index] !== null ||
      isGameOver ||
      (gameMode === "pvc" && currentPlayer !== HUMAN_PLAYER)
    )
      return

    commitMove(index, currentPlayer)
  }

  const handleShowBestMove = () => {
    if (isGameOver) return
    const best = calculateBestMove(squares)
    if (best !== -1) setBestMoveIndex(best)
  }

  const resetGame = () => {
    setSquares(createEmptySquares())
    setHistory([])
    setCurrentPlayer(HUMAN_PLAYER)
    setBestMoveIndex(null)
  }

  const handleSetGameMode = (mode: GameMode) => {
    setGameMode(mode)
    resetGame()
  }

  return (
    <>
      <h1>Tic Tac Toe</h1>
      <div className="game-mode">
        {(["freeplay", "online", "pvc"] as GameMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleSetGameMode(mode)}
            style={{ fontWeight: gameMode === mode ? "bold" : "normal" }}
          >
            {mode === "freeplay"
              ? "Free Play"
              : mode === "online"
                ? "Online"
                : "Player vs Computer"}
          </button>
        ))}
      </div>
      <p>Current Mode: {gameMode}</p>

      <div className="tictactoe">
        <div>
          <Status winner={winner} isTie={isTie} nextPlayer={currentPlayer} />
          <Board
            squares={squares}
            bestMoveIndex={bestMoveIndex}
            onPlay={handlePlay}
          />
          <div className="tictactoe-actions">
            <BasicButton
              className="show-best-move-button"
              size="medium"
              onClick={handleShowBestMove}
            >
              Show best move
            </BasicButton>
            <BasicButton
              className="reset-button"
              size="medium"
              onClick={resetGame}
            >
              Reset Game
            </BasicButton>
          </div>
        </div>
        <div>
          <h2>Move History</h2>
          <History history={history} />
        </div>
      </div>
    </>
  )
}

type StatusProps = { winner: Player | null; isTie: boolean; nextPlayer: Player }

const Status = ({ winner, isTie, nextPlayer }: StatusProps) => {
  if (winner) return <h2>Winner: {winner}</h2>
  if (isTie) return <h2>It's a Tie!</h2>
  return <h2>Next player: {nextPlayer}</h2>
}
