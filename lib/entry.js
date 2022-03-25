const scrapeIt = require("scrape-it")
const assert = require("assert")
const Scorer = require("bracket-scorer")
const { decode } = require("html-entities")
const { o, entryUrl } = require("./options.js")

const espn = (picks) => {
  // The scraper returns an array of picks, the index of each pick
  // in that list corresponds to a value here
  const final = "FF"
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
}

const main = (s) => `#pane-main ${s}`
const int = (s) => ({
  selector: s,
  convert: (d) => (d ? parseInt(d, 10) : null),
})

const fetchBracket = async (id) =>
  scrapeIt(entryUrl(id), {
    score: int(main(".value.points")),
    max: int(main(".ppr .value")),
    name: ".entry-details-displayname",
    entryName: ".entry-details-entryname",
    picks: {
      listItem: main(".mW .matchup"),
      data: {
        pick: int(".selectedToAdvance .seed"),
        actual: int(".actual.winner .seed"),
        name: ".selectedToAdvance .abbrev",
      },
    },
  }).then(({ data: { picks, name, entryName, ...data } }) => ({
    ...data,
    ...espn(picks),
    name: decode(entryName) + "/" + decode(name),
    id: id.toString(),
  }))

const getBracket = async (id) => {
  const { actual, ...entry } = await fetchBracket(id)

  // make sure my scores match espns so i can be trusted
  const s = new Scorer({
    ...o,
    entry: entry.bracket,
    master: actual,
  })

  assert.equal(s.standard(), entry.score)
  assert.equal(s.standard() + s.standardPPR(), entry.max)

  return {
    actual,
    entry,
  }
}

module.exports = getBracket
