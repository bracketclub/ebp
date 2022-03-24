const fs = require("fs/promises")
const path = require("path")

const mkdir = async (id) => {
  const dir = path.resolve(process.cwd(), `ebp-${id}`)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

const put = async (id, name, data) => {
  if (!data) return
  const dir = await mkdir(id)
  await fs.writeFile(
    path.join(dir, `${name}.json`),
    JSON.stringify(data, null, 2)
  )
  return data
}

const get = async (id, name) => {
  const dir = await mkdir(id)
  const data = await fs.readFile(path.join(dir, `${name}.json`), "utf-8")
  return JSON.parse(data)
}

module.exports = { put, get }
