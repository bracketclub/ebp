const scrapeIt = require("scrape-it")
const assert = require("assert")
const fetch = require("node-fetch")
const Scorer = require("bracket-scorer")
const { decode } = require("html-entities")
const { put, get } = require("./data")
const sLog = require("single-line-log").stdout

const o = { sport: "ncaam", year: "2022" }
const FILENAME = "entries"

const espn = {
  $: (s) => `#pane-main ${s}`,
  baseUrl: "https://fantasy.espn.com/tournament-challenge-bracket/2022/en",
  entryUrl: (id) => `${espn.baseUrl}/entry?entryID=${id}`,
  groupUrl: (id) => `${espn.baseUrl}/api/v7/group?groupID=${id}&length=50`,
  bracket: (picks) => {
    const final = "FF"

    // The scraper returns an array of picks, the index of each pick
    // in that list corresponds to a value here
    const order = {
      W: [0, 1, 2, 3, 4, 5, 6, 7, 32, 33, 34, 35, 48, 49, 56],
      E: [8, 9, 10, 11, 12, 13, 14, 15, 36, 37, 38, 39, 50, 51, 57],
      S: [16, 17, 18, 19, 20, 21, 22, 23, 40, 41, 42, 43, 52, 53, 58],
      MW: [24, 25, 26, 27, 28, 29, 30, 31, 44, 45, 46, 47, 54, 55, 59],
      [final]: [60, 61, 62],
    }

    const teams = {}
    const get = (name, pick, region) => {
      if (pick && region === final) {
        return teams[name]
      }
      return pick
    }
    const put = (pick, region) => {
      if (region !== final) {
        teams[pick.name] = region
      }
      return pick
    }

    return Object.entries(order).reduce(
      (brackets, [region, games]) => (
        (brackets.bracket += region),
        (brackets.actual += region),
        games
          .map((game) => put(picks[game], region))
          .map(({ name, pick, actual }) => [
            get(name, pick, region),
            get(name, actual, region) ?? "X",
          ])
          .reduce(
            (brackets, [e, m]) => (
              (brackets.bracket += e), (brackets.actual += m), brackets
            ),
            brackets
          )
      ),
      { bracket: "", actual: "" }
    )
  },
}

const int = (s) => ({
  selector: s,
  convert: (d) => (d ? parseInt(d, 10) : null),
})

const getBracket = async (id) =>
  scrapeIt(espn.entryUrl(id), {
    score: int(espn.$(".value.points")),
    max: int(espn.$(".ppr .value")),
    picks: {
      listItem: espn.$(".mW .matchup"),
      data: {
        pick: int(".selectedToAdvance .seed"),
        actual: int(".actual.winner .seed"),
        name: ".selectedToAdvance .abbrev",
      },
    },
  }).then(({ data }) => ({
    ...espn.bracket(data.picks),
    score: data.score,
    max: data.max,
  }))

const fetchEntries = async (id) => {
  sLog(`Fetching Group Id ${id}`)

  const {
    g: { e: entries, n: name },
  } = await fetch(espn.groupUrl(id)).then((r) => r.json())

  const log = (() => {
    let completed = -1
    return () =>
      sLog(
        `Fetching ${JSON.stringify(name)} entries: ${++completed}/${
          entries.length
        }`
      )
  })()

  log()

  const data = await Promise.all(
    entries.map(async (e) => {
      const bracket = await getBracket(e.id)
      log()
      return {
        ...bracket,
        id: e.id,
        name: decode(e.n_e) + "/" + decode(e.n_d),
      }
    })
  )

  const actual = data[0].actual
  // assert no caching issues so that all actuals are the same
  assert(data.every((e) => e.actual === actual))

  // make sure my scores match espns so i can be trusted
  data.forEach((entry) => {
    const s = new Scorer({
      ...o,
      entry: entry.bracket,
      master: actual,
    })

    assert.equal(s.standard(), entry.score)
    assert.equal(s.standard() + s.standardPPR(), entry.max)

    delete entry.actual
  })

  sLog.clear()

  return put(id, FILENAME, { actual, entries: data })
}

const getOrFetch = async (id, { refresh } = {}) => {
  if (refresh) {
    return fetchEntries(id)
  }
  return get(id, FILENAME).catch(() => fetchEntries(id))
}

module.exports = {
  fetch: fetchEntries,
  getOrFetch,
}
