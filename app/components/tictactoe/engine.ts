export type Mark = "X" | "O"
export type Board = (Mark | null)[]
export const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]
export const emptyBoard = (): Board => Array(9).fill(null)
export const other = (mark: Mark): Mark => (mark === "X" ? "O" : "X")
export function result(board: Board) {
  const line = lines.find(
    ([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]
  )
  return {
    winner: line ? board[line[0]] : null,
    line: line ?? [],
    draw: !line && board.every(Boolean),
  }
}
const cache = new Map<string, number>()
function value(board: Board, turn: Mark): number {
  const end = result(board)
  if (end.winner) return -1
  if (end.draw) return 0
  const key = board.map((x) => x ?? "-").join("") + turn
  if (cache.has(key)) return cache.get(key)!
  const score = Math.max(
    ...board.flatMap((cell, i) =>
      cell
        ? []
        : [
            -value(
              board.map((v, j) => (i === j ? turn : v)),
              other(turn)
            ),
          ]
    )
  )
  cache.set(key, score)
  return score
}
export function moves(board: Board, turn: Mark) {
  if (result(board).winner || result(board).draw) return []
  return [4, 0, 2, 6, 8, 1, 3, 5, 7]
    .filter((i) => !board[i])
    .map((i) => ({
      i,
      score: -value(
        board.map((v, j) => (i === j ? turn : v)),
        other(turn)
      ),
    }))
    .sort((a, b) => b.score - a.score)
}
export function explain(board: Board, turn: Mark, i: number) {
  const next = board.map((v, j) => (i === j ? turn : v))
  if (result(next).winner)
    return "Finish the line. Three in a row wins the game."
  if (result(board.map((v, j) => (i === j ? other(turn) : v))).winner)
    return "Block the threat. Your opponent could win on this square next turn."
  const threats = lines.filter(
    (line) =>
      line.filter((j) => next[j] === turn).length === 2 &&
      line.some((j) => !next[j])
  )
  if (threats.length > 1)
    return "Create a fork: two winning threats that cannot both be blocked."
  if (i === 4)
    return "Control the center. It belongs to four possible winning lines."
  return "Keep your position safe. This move preserves the best possible outcome with perfect play."
}
