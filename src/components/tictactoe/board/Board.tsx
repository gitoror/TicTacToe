import "./Board.css"

export type BoardProps = {
  squares: string[]
  onPlay: (i: number) => void
}

export const Board = ({ squares, onPlay: onPlay }: BoardProps) => {
  const handleClickSquare = (i: number) => {
    onPlay(i)
  }

  return (
    <div className="board">
      <div className="board-row">
        <Square value={squares[0]} onClickSquare={() => handleClickSquare(0)} />
        <Square value={squares[1]} onClickSquare={() => handleClickSquare(1)} />
        <Square value={squares[2]} onClickSquare={() => handleClickSquare(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onClickSquare={() => handleClickSquare(3)} />
        <Square value={squares[4]} onClickSquare={() => handleClickSquare(4)} />
        <Square value={squares[5]} onClickSquare={() => handleClickSquare(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onClickSquare={() => handleClickSquare(6)} />
        <Square value={squares[7]} onClickSquare={() => handleClickSquare(7)} />
        <Square value={squares[8]} onClickSquare={() => handleClickSquare(8)} />
      </div>
    </div>
  )
}

type SquareProps = {
  value: string
  onClickSquare: () => void
}

const Square = ({ value, onClickSquare }: SquareProps) => {
  return (
    <button className="square" onClick={onClickSquare}>
      {value}
    </button>
  )
}
