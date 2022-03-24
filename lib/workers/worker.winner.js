const { nextGame } = require("bracket-possibilities/lib/each-game")
const Validator = require("bracket-validator")
const Updater = require("bracket-updater")
const Scorer = require("bracket-scorer")
const pick = require("just-pick")

module.exports = ({ o, combo, actual, entries }) => {
  const updater = new Updater(o)
  const validator = new Validator(o)

  const finalResult = combo.reduce((memo, c) => {
    return updater.update({
      currentMaster: memo,
      ...nextGame(
        validator.validate(memo),
        ({ prevRound, game, region, gameIndex }) => {
          if (game === null) {
            return {
              fromRegion: region.id,
              winner: pick(prevRound[gameIndex * 2 + c], "seed", "name"),
              playedCompetitions: prevRound[gameIndex * 2 + c].winsIn,
            }
          }
        }
      ),
    })
  }, actual)

  const s = new Scorer({
    ...o,
    entry: entries,
    master: finalResult,
  })

  const [winner, ...ranked] = s.standard().sort((a, b) => b.score - a.score)
  const ties = ranked.filter((s) => s.score === winner.score)

  return { winners: [winner, ...ties].map((w) => w.name), bracket: finalResult }
}
