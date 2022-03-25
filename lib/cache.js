const fs = require("fs/promises")
const path = require("path")

const getDir = (id) => path.resolve(process.cwd(), `ebp-${id}`)

const mkdir = async (id) => {
  const dir = getDir(id)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

const put = async (id, name, data) => {
  if (!data) return
  const dir = await mkdir(id)
  const file = path.join(dir, `${name}.json`)
  await fs.writeFile(file, JSON.stringify(data, null, 2))
  return file
}

const get = async (id, name) => {
  const data = await fs.readFile(path.join(getDir(id), `${name}.json`), "utf-8")
  return JSON.parse(data)
}

module.exports = { put, get }
