#!/usr/bin/env node

const getResults = require("../lib/index.js")
const { relative } = require("path")

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

getResults(id, method, flags)
  .then((savePath) => {
    if (savePath) {
      console.log(
        `\nResults saved to ${JSON.stringify(
          relative(process.cwd(), savePath)
        )}`
      )
    }
  })
  .catch((e) => {
    process.exitCode = 1
    throw e
  })
