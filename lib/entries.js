const assert = require("assert")
const fetch = require("node-fetch")
const Scorer = require("bracket-scorer")
const getEntry = require("./entry.js")
const { o, groupUrl } = require("./options.js")

const fetchEntries = async (id, { log: sLog = () => {} } = {}) => {
  sLog(`Fetching Group Id ${id}`)

  const { g: raw } = await fetch(groupUrl(id)).then((r) => r.json())

  const log = (() => {
    let completed = -1
    return () =>
      sLog(
        `Fetching ${JSON.stringify(raw.n)} entries ${++completed}/${
          raw.e.length
        }`
      )
  })()

  log()
  const entries = await Promise.all(
    raw.e.map(async (e) => {
      const res = await getEntry(e.id)
      log()
      return res
    })
  )

  // assert no caching issues so that all actuals are the same
  const actual = entries[0].actual
  assert(entries.every((e) => e.actual === actual))

  return {
    actual,
    entries: entries.map(({ entry }) => {
      // make sure my scores match espns so i can be trusted
      const s = new Scorer({
        ...o,
        entry: entry.bracket,
        master: actual,
      })

      assert.equal(s.standard(), entry.score)
      assert.equal(s.standard() + s.standardPPR(), entry.max)

      return entry
    }),
  }
}

module.exports = fetchEntries
