import { randomBytes } from "node:crypto"
import {
  emptyBoard,
  other,
  result,
  type Board,
  type Mark,
} from "../components/tictactoe/engine"
type Room = {
  board: Board
  turn: Mark
  players: { X: string; O?: string }
  updated: number
  round: number
  votes: string[]
}
const rooms = new Map<string, Room>()
const token = () => randomBytes(24).toString("hex")
const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } })
function clean() {
  for (const [id, room] of rooms)
    if (Date.now() - room.updated > 7200000) rooms.delete(id)
}
function snapshot(id: string, room: Room, mark: Mark) {
  return {
    id,
    board: room.board,
    turn: room.turn,
    mark,
    ready: !!room.players.O,
    round: room.round,
    rematchRequested: room.votes.length > 0,
  }
}
export async function loader({ request }: { request: Request }) {
  clean()
  const id = new URL(request.url).searchParams.get("id") ?? ""
  const room = rooms.get(id)
  const credential = request.headers
    .get("Authorization")
    ?.replace("Bearer ", "")
  if (!room)
    return reply(
      { error: "Room expired or not found. Create a new room." },
      404
    )
  const mark =
    credential === room.players.X
      ? "X"
      : credential && credential === room.players.O
        ? "O"
        : null
  if (!mark) return reply({ error: "Please join this room first." }, 403)
  return reply(snapshot(id, room, mark))
}
export async function action({ request }: { request: Request }) {
  if (
    request.headers.get("Origin") &&
    request.headers.get("Origin") !== new URL(request.url).origin
  )
    return reply({ error: "Invalid origin" }, 403)
  clean()
  let body: {
    action?: string
    id?: string
    token?: string
    index?: number
    round?: number
  }
  try {
    body = await request.json()
  } catch {
    return reply({ error: "Invalid request" }, 400)
  }
  if (!body || typeof body !== "object")
    return reply({ error: "Invalid request" }, 400)
  if (body.action === "create") {
    if (rooms.size >= 2000)
      return reply({ error: "Rooms are busy. Please try again later." }, 503)
    const id = randomBytes(5).toString("hex").toUpperCase(),
      credential = token()
    const room: Room = {
      board: emptyBoard(),
      turn: "X",
      players: { X: credential },
      updated: Date.now(),
      round: 1,
      votes: [],
    }
    rooms.set(id, room)
    return reply({ ...snapshot(id, room, "X"), token: credential })
  }
  const id = typeof body.id === "string" ? body.id.toUpperCase() : "",
    room = rooms.get(id)
  if (!room)
    return reply(
      { error: "Room expired or not found. Check your room code." },
      404
    )
  const mark: Mark | null =
    body.token === room.players.X
      ? "X"
      : body.token && body.token === room.players.O
        ? "O"
        : null
  if (body.action === "join" && !mark) {
    if (room.players.O)
      return reply({ error: "This room already has two players." }, 409)
    const credential = token()
    room.players.O = credential
    room.updated = Date.now()
    return reply({ ...snapshot(id, room, "O"), token: credential })
  }
  if (!mark) return reply({ error: "You are not a player in this room." }, 403)
  if (body.action === "move") {
    const i = body.index
    if (
      body.round !== room.round ||
      !room.players.O ||
      room.turn !== mark ||
      !Number.isInteger(i) ||
      i! < 0 ||
      i! > 8 ||
      room.board[i!] ||
      result(room.board).winner ||
      result(room.board).draw
    )
      return reply(
        { error: "That move is no longer available. Please try again." },
        409
      )
    room.board[i!] = mark
    room.turn = other(mark)
  } else if (body.action === "rematch") {
    if (!result(room.board).winner && !result(room.board).draw)
      return reply({ error: "Finish this round first." }, 409)
    if (!room.votes.includes(mark)) room.votes.push(mark)
    if (room.votes.length === 2) {
      room.board = emptyBoard()
      room.turn = "X"
      room.round++
      room.votes = []
    }
  } else if (body.action !== "join")
    return reply({ error: "Unknown action" }, 400)
  room.updated = Date.now()
  return reply(snapshot(id, room, mark))
}
