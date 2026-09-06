import type { PropsWithChildren } from "react"

export default function Game() {
  return (
    <div className="w-full h-screen flex flex-col">
      <h1 className="text-center mb-8">Tic Tac Toe</h1>
      <Board />
    </div>
  )
}

function Board() {
  function handleClick(i: number) {
    console.log("click", i)
  }

  return (
    <div className="bg-red-300 w-80 h-80 mx-auto text-center flex items-center  justify-center">
      <div className="w-60 h-60 border-2 border-black text-center">
        <div>
          <Square onSquareClick={() => handleClick(0)}>x</Square>
          <Square onSquareClick={() => handleClick(1)}>O</Square>
          <Square onSquareClick={() => handleClick(2)}>O</Square>
        </div>
        <div>
          <Square onSquareClick={() => handleClick(3)}>x</Square>
          <Square onSquareClick={() => handleClick(4)}>O</Square>
          <Square onSquareClick={() => handleClick(5)}>O</Square>
        </div>
        <div>
          <Square onSquareClick={() => handleClick(6)}>x</Square>
          <Square onSquareClick={() => handleClick(7)}>O</Square>
          <Square onSquareClick={() => handleClick(8)}>x</Square>
        </div>
      </div>
    </div>
  )
}

function Square({
  children,
  onSquareClick: onSquareClick,
}: PropsWithChildren<{ onSquareClick: () => void }>) {
  return (
    <button className="square" onClick={onSquareClick}>
      {children}
    </button>
  )
}
