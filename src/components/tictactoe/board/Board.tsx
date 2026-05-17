import "./Board.css"

export type BoardProps = {
  squares: (string | null)[]
  bestMoveIndex: number | null
  onPlay: (i: number) => void
}

export const Board = ({ squares, bestMoveIndex, onPlay }: BoardProps) => (
  <div className="board">
    {[0, 1, 2].map((row) => (
      <div key={row} className="board-row">
        {[0, 1, 2].map((col) => {
          const index = row * 3 + col
          return (
            <Square
              key={index}
              value={squares[index]}
              isHighlighted={bestMoveIndex === index}
              onClickSquare={() => onPlay(index)}
            />
          )
        })}
      </div>
    ))}
  </div>
)

type SquareProps = {
  value: string | null
  isHighlighted: boolean
  onClickSquare: () => void
}

const Square = ({ value, isHighlighted, onClickSquare }: SquareProps) => (
  <button
    className={`square${isHighlighted ? " square--highlighted" : ""}`}
    onClick={onClickSquare}
  >
    {value}
  </button>
)