#!/usr/bin/env node

const getResults = require("../lib/results.js")

const [id, ...rest] = process.argv.slice(2)
const { method, flags } = rest.reduce(
  (acc, a) => {
    if (a.startsWith("--")) {
      acc.flags[a.slice(2)] = true
    } else {
      acc.method = a
    }
    return acc
  },
  { method: "all", flags: {} }
)

getResults(id, method, flags).catch((e) => {
  process.exitCode = 1
  throw e
})
