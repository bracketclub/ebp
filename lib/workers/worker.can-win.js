const Possibilities = require("bracket-possibilities")

module.exports = ({ o, entries, actual, name }) => {
  const p = new Possibilities(o)
  return p.canWin({
    entries,
    master: actual,
    findEntry: (e) => e.name === name,
  })
}
