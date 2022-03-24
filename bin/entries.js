#!/usr/bin/env node

const { fetch } = require("../lib/entries.js")

fetch(process.argv[2]).catch((e) => {
  process.exitCode = 1
  throw e
})
