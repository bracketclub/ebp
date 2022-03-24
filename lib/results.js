const path = require("path")
const binaryCombinations = require("bracket-possibilities/lib/binary-combinations")
const sLog = require("single-line-log").stdout
const { getOrFetch } = require("./entries.js")
const { put, get } = require("./data.js")
const Piscina = require("piscina")

const o = { sport: "ncaam", year: "2022" }

const getWorker = (name) => {
  const fn = new Piscina({
    filename: path.resolve(__dirname, "workers", `worker.${name}.js`),
  })
  return (rest) => fn.run({ o, ...rest })
}

const log = (str, done = false) => (done && sLog.clear(), sLog(str))

// get every possible remaining combination and figure out the winner
// this includes ties but has no tiebreaking scenarios
const all = async ({ entries, actual }, { cached } = {}) => {
  const gamesLeft = actual.match(/X/g)?.length ?? 0
  const combinations = binaryCombinations(gamesLeft)
  let count = cached ? combinations.length : 0

  const results = (cached ?? entries).reduce((acc, { name, winners = [] }) => {
    acc[name] = winners
    return acc
  }, {})

  const display = (done) =>
    log(
      [
        `Checked ${count} of ${combinations.length} possible outcomes`,
        ...Object.entries(results)
          .sort(([, a], [, b]) => b.length - a.length)
          .map(([name, winners]) =>
            [
              (count === combinations.length
                ? winners.length
                  ? "✅ "
                  : "❌ "
                : "") +
                winners.length
                  .toString()
                  .padStart(combinations.length.toString().length, " "),
              name,
            ]
              .filter((v) => v !== null)
              .join(" -- ")
          ),
      ].join("\n"),
      done
    )

  if (cached) {
    return display(true)
  }

  const winner = getWorker("winner")

  await Promise.all(
    combinations.map(async (combo) => {
      const { bracket, winners } = await winner({ combo, actual, entries })
      count++
      winners.forEach((w) => results[w].push(bracket))
      display()
    })
  )

  display(true)

  return Object.entries(results).map(([name, winners]) => ({
    name,
    total: winners.length,
    winners,
  }))
}

const canWin = async ({ entries, actual }, { cached } = {}) => {
  const results = (cached ?? entries).reduce(
    (acc, { name, canWin = null }) => ((acc[name] = canWin ?? "❔"), acc),
    {}
  )

  const display = (done) =>
    log(
      Object.entries(results)
        .map(([name, canWin]) =>
          [
            typeof canWin === "string" ? canWin : canWin ? "✅" : "❌",
            name,
          ].join(" -- ")
        )
        .join("\n"),
      done
    )

  if (cached) {
    return display(true)
  }

  const canWinWorker = getWorker("can-win")

  await Promise.all(
    entries.map(async ({ name }) => {
      results[name] = "🔄"
      display()
      results[name] = await canWinWorker({ o, name, entries, actual })
      display()
    })
  )

  display(true)

  return Object.entries(results).map(([name, cw]) => ({
    name,
    canWin: !!cw,
    bracket: cw?.bracket,
  }))
}

const methods = {
  all,
  "can-win": canWin,
}

const getResults = async (id, method, { refresh } = {}) => {
  const filename = `results-${method}`

  const entries = await getOrFetch(id, { refresh })
  const cached = refresh ? null : await get(id, filename).catch(() => null)
  const results = await methods[method](entries, { cached })
  await put(id, filename, results)
}

module.exports = getResults
