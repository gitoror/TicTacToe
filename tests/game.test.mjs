import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import ts from "typescript"
const compile = (path) =>
  ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
const url = (text) =>
  `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`
const engineUrl = url(compile("../app/components/tictactoe/engine.ts"))
const { emptyBoard, result, moves, other } = await import(engineUrl)
const { action, loader } = await import(
  url(
    compile("../app/routes/room.ts").replace(
      "../components/tictactoe/engine",
      engineUrl
    )
  )
)

for (const ai of ["X", "O"])
  test(`Perfect AI cannot lose playing ${ai} against any legal opponent sequence`, () => {
    let terminals = 0
    function walk(board, turn) {
      const end = result(board)
      if (end.winner || end.draw) {
        assert.notEqual(end.winner, other(ai))
        terminals++
        return
      }
      const choices =
        turn === ai
          ? [moves(board, turn)[0].i]
          : board.flatMap((v, i) => (v ? [] : [i]))
      for (const i of choices)
        walk(
          board.map((v, j) => (j === i ? turn : v)),
          other(turn)
        )
    }
    walk(emptyBoard(), "X")
    assert.ok(terminals > 0)
  })
test("Engine finds wins, blocks threats, and ends games", () => {
  assert.equal(
    moves(["X", "X", null, "O", "O", null, null, null, null], "X")[0].i,
    2
  )
  assert.equal(
    moves(["O", "O", null, null, "X", null, null, null, "X"], "X")[0].i,
    2
  )
  assert.deepEqual(
    result(["X", "X", "X", "O", "O", null, null, null, null]).line,
    [0, 1, 2]
  )
  assert.equal(result(["X", "O", "X", "X", "O", "O", "O", "X", "X"]).draw, true)
})
const send = async (body) => {
  const response = await action({
    request: new Request("http://localhost/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  })
  return { status: response.status, data: await response.json() }
}
test("Private rooms enforce credentials, turns, occupancy, round versions, and mutual rematch", async () => {
  const host = (await send({ action: "create" })).data
  const guest = (await send({ action: "join", id: host.id })).data
  assert.equal((await send({ action: "join", id: host.id })).status, 409)
  assert.equal(
    (
      await send({
        action: "move",
        id: host.id,
        token: "fake",
        index: 0,
        round: 1,
      })
    ).status,
    403
  )
  assert.equal(
    (
      await send({
        action: "move",
        id: host.id,
        token: guest.token,
        index: 0,
        round: 1,
      })
    ).status,
    409
  )
  for (const [n, index] of [0, 3, 1, 4, 2].entries()) {
    const moved = await send({
      action: "move",
      id: host.id,
      token: n % 2 ? guest.token : host.token,
      index,
      round: 1,
    })
    assert.equal(moved.status, 200)
    if (n === 0)
      assert.equal(
        (
          await send({
            action: "move",
            id: host.id,
            token: guest.token,
            index: 0,
            round: 1,
          })
        ).status,
        409
      )
  }
  assert.equal(
    (
      await send({
        action: "move",
        id: host.id,
        token: guest.token,
        index: 8,
        round: 1,
      })
    ).status,
    409
  )
  const first = await send({
    action: "rematch",
    id: host.id,
    token: host.token,
  })
  assert.equal(first.data.round, 1)
  const second = await send({
    action: "rematch",
    id: host.id,
    token: guest.token,
  })
  assert.equal(second.data.round, 2)
  assert.deepEqual(second.data.board, emptyBoard())
  assert.equal(
    (
      await send({
        action: "move",
        id: host.id,
        token: host.token,
        index: 0,
        round: 1,
      })
    ).status,
    409
  )
  const read = await loader({
    request: new Request(`http://localhost/api/room?id=${host.id}`, {
      headers: { Authorization: `Bearer ${guest.token}` },
    }),
  })
  assert.equal(read.status, 200)
  assert.equal((await read.json()).mark, "O")
  assert.equal(
    (
      await loader({
        request: new Request(`http://localhost/api/room?id=${host.id}`),
      })
    ).status,
    403
  )
})
