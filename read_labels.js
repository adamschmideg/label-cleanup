const fs = require("fs")
const GithubGraphQLApi = require('node-github-graphql')
const json2csv = require('json2csv').parse

const simpleColumns = "name,color".split(",")
const totalCountColumns = "open_issues,closed_issues".split(",")
const columns = simpleColumns.concat(totalCountColumns)

const slurp = (filename) => { return fs.readFileSync(filename).toString() }

const token = slurp("TOKEN").trim()

const github = new GithubGraphQLApi({
  Promise: require('bluebird'),
  token: token,
  userAgent: 'clean-labels'
})

const query = slurp("query.graphql")

const execQuery = async (query) => {
  let result
  await github.query(query)
    .then((res) => { result = res })
    .catch((err) => { return console.log(err) })
  return result
}

const extractValues = async (rawData) => {
  const root = rawData.data.repository.labels.nodes
  let result = []
  for (const node of root) {
    let values = {}
    for (const column of simpleColumns) {
      values[column] = node[column]
    }
    for (const column of totalCountColumns) {
      values[column] = node[column].totalCount
    }
    result.push(values)
  }
  return result
}

const writeToCsv = (fields, rows) => {
  try {
    const opts = { fields: fields, quote: "\"", header: true}
    const csv = json2csv(rows, opts)
    console.log(csv)
  }
  catch (err) {
    console.log(err)
  }
}

const _main = async () => {
  const data = [
    {name: {first: "Joe"}, id: 1},
    {name: {first: "Jane"}, id: 2}
  ]
  writeToCsv("name.first,id".split(","), data, "temp.csv")
}

const testQuery = '{  viewer { login }}'

const main = async () => {
  const raw = await execQuery(query)
  const res = await extractValues(raw)
  writeToCsv(columns, res, "result.csv")
  // console.log(res)
}

main()