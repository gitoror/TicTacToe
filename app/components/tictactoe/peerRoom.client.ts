import type { DataConnection, Peer } from "peerjs"

import { emptyBoard, other, result, type Board, type Mark } from "./engine"

export type PeerRoom = {
  id: string
  board: Board
  turn: Mark
  mark: Mark
  ready: boolean
  round: number
  rematchRequested: boolean
}

type ClientMessage =
  | { type: "move"; index: number; round: number }
  | { type: "rematch" }

type HostMessage =
  | { type: "snapshot"; room: PeerRoom }
  | { type: "error"; message: string }

const roomPeerId = (code: string) => `nought-${code.toLowerCase()}`
const makeCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")
}

const waitFor = (
  subscribe: (resolve: () => void, reject: (error: Error) => void) => void,
  message: string
) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), 15_000)
    subscribe(
      () => {
        window.clearTimeout(timer)
        resolve()
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      }
    )
  })

export class PeerRoomClient {
  private peer?: Peer
  private connection?: DataConnection
  private room?: PeerRoom
  private host = false
  private closing = false
  private votes = new Set<Mark>()

  constructor(
    private readonly update: (room: PeerRoom) => void,
    private readonly report: (message: string) => void
  ) {}

  async create() {
    this.destroy()
    this.closing = false
    const { Peer } = await import("peerjs")
    const code = makeCode()
    const peer = new Peer(roomPeerId(code), { debug: 1 })
    this.peer = peer
    this.host = true
    peer.on("connection", (connection) => this.accept(connection))
    await waitFor((resolve, reject) => {
      peer.once("open", () => resolve())
      peer.once("error", (error) => reject(error))
    }, "The room service did not answer. Please try again.")
    peer.on("error", () =>
      this.report("The room connection was interrupted. Please try again.")
    )
    this.room = {
      id: code,
      board: emptyBoard(),
      turn: "X",
      mark: "X",
      ready: false,
      round: 1,
      rematchRequested: false,
    }
    this.update(this.room)
    return this.room
  }

  async join(code: string) {
    this.destroy()
    this.closing = false
    const normalized = code.trim().toUpperCase()
    if (!/^[A-Z2-9]{8}$/.test(normalized)) {
      throw new Error("Enter the 8-character room code from your friend.")
    }
    const { Peer } = await import("peerjs")
    const peer = new Peer({ debug: 1 })
    this.peer = peer
    await waitFor((resolve, reject) => {
      peer.once("open", () => resolve())
      peer.once("error", (error) => reject(error))
    }, "The room service did not answer. Please try again.")
    this.room = {
      id: normalized,
      board: emptyBoard(),
      turn: "X",
      mark: "O",
      ready: true,
      round: 1,
      rematchRequested: false,
    }
    const connection = peer.connect(roomPeerId(normalized), {
      reliable: true,
      serialization: "json",
    })
    this.connection = connection
    this.bindGuest(connection)
    await waitFor((resolve, reject) => {
      connection.once("open", resolve)
      connection.once("error", () =>
        reject(
          new Error(
            "Could not reach that room. Check the code and ask your friend to keep the room open."
          )
        )
      )
    }, "Could not reach that room. Check the code and ask your friend to keep the room open.")
    this.update(this.room)
    return this.room
  }

  act(action: "move" | "rematch", index?: number) {
    if (!this.room || !this.connection?.open) {
      throw new Error("The other player is not connected yet.")
    }
    if (this.host) {
      this.apply(
        {
          type: action,
          ...(action === "move"
            ? { index: index ?? -1, round: this.room.round }
            : {}),
        } as ClientMessage,
        "X"
      )
    } else {
      const message: ClientMessage =
        action === "move"
          ? { type: "move", index: index ?? -1, round: this.room.round }
          : { type: "rematch" }
      this.connection.send(message)
    }
  }

  destroy() {
    this.closing = true
    this.connection?.close()
    this.peer?.destroy()
    this.connection = undefined
    this.peer = undefined
    this.room = undefined
    this.host = false
    this.votes.clear()
  }

  private accept(connection: DataConnection) {
    if (this.connection) {
      connection.on("open", () => connection.close())
      return
    }
    this.connection = connection
    connection.on("open", () => {
      if (!this.room) return
      this.room = { ...this.room, ready: true }
      this.update(this.room)
      this.sendSnapshot()
    })
    connection.on("data", (data) => {
      if (this.isClientMessage(data)) this.apply(data, "O")
    })
    connection.on("close", () => {
      if (this.closing) return
      this.connection = undefined
      this.votes.delete("O")
      if (!this.room) return
      this.room = { ...this.room, ready: false, rematchRequested: false }
      this.update(this.room)
      this.report("Your friend disconnected. They can join this room again.")
    })
    connection.on(
      "error",
      () =>
        !this.closing &&
        this.report("Your friend’s connection was interrupted.")
    )
  }

  private bindGuest(connection: DataConnection) {
    connection.on("data", (data) => {
      if (!this.isHostMessage(data)) return
      if (data.type === "error") this.report(data.message)
      else {
        this.room = { ...data.room, mark: "O" }
        this.update(this.room)
        this.report("")
      }
    })
    connection.on(
      "close",
      () =>
        !this.closing &&
        this.report("The room closed because its creator disconnected.")
    )
    connection.on(
      "error",
      () =>
        !this.closing &&
        this.report("The connection to the room was interrupted.")
    )
  }

  private apply(message: ClientMessage, mark: Mark) {
    if (!this.room) return
    if (message.type === "move") {
      const end = result(this.room.board)
      if (
        !this.room.ready ||
        message.round !== this.room.round ||
        this.room.turn !== mark ||
        !Number.isInteger(message.index) ||
        message.index < 0 ||
        message.index > 8 ||
        this.room.board[message.index] ||
        end.winner ||
        end.draw
      ) {
        this.reject("That move is no longer available.", mark)
        return
      }
      const board = this.room.board.map((cell, index) =>
        index === message.index ? mark : cell
      )
      this.room = { ...this.room, board, turn: other(mark) }
    } else {
      const end = result(this.room.board)
      if (!end.winner && !end.draw) {
        this.reject("Finish this round first.", mark)
        return
      }
      this.votes.add(mark)
      if (this.votes.size === 2) {
        this.votes.clear()
        this.room = {
          ...this.room,
          board: emptyBoard(),
          turn: "X",
          round: this.room.round + 1,
          rematchRequested: false,
        }
      } else this.room = { ...this.room, rematchRequested: true }
    }
    this.update(this.room)
    this.sendSnapshot()
  }

  private sendSnapshot() {
    if (!this.room || !this.connection?.open) return
    this.connection.send({
      type: "snapshot",
      room: { ...this.room, mark: "O" },
    } satisfies HostMessage)
  }

  private reject(message: string, mark: Mark) {
    if (mark === "X") this.report(message)
    else if (this.connection?.open)
      this.connection.send({ type: "error", message } satisfies HostMessage)
  }

  private isClientMessage(data: unknown): data is ClientMessage {
    if (!data || typeof data !== "object" || !("type" in data)) return false
    const message = data as Record<string, unknown>
    return (
      message.type === "rematch" ||
      (message.type === "move" &&
        typeof message.index === "number" &&
        typeof message.round === "number")
    )
  }

  private isHostMessage(data: unknown): data is HostMessage {
    if (!data || typeof data !== "object" || !("type" in data)) return false
    const message = data as Record<string, unknown>
    return (
      (message.type === "error" && typeof message.message === "string") ||
      (message.type === "snapshot" && !!message.room)
    )
  }
}
