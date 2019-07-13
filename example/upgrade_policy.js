#!/usr/bin/env

const fs = require('fs');
const path = require('path');

async function readJSONFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, text) => {
      if (err) reject(err)
      else resolve(JSON.parse(text))
    })
  })
}

async function writeJSONFile(filePath, content) {
  const json = JSON.stringify(content, null, 4)
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, json, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}

;(async () => {
  const filePath = process.argv[2]
  if (!filePath) {
    console.log('Usage) node upgrade_policy.js <policy JSON file>')
    process.exit(2)
    return
  }

  const document = await readJSONFile(filePath)
  if (document.Document) {
    console.warn('[WARN] %s : This policy definition is already new version.', filePath)
    process.exit(3)
    return
  }

  const newDoc = {
    Policy: {
      PolicyName: path.basename(filePath, '.json'),
      Path: '/'
    },
    Document: document
  }
  await writeJSONFile(filePath, newDoc)
})()
.catch(err => {
  console.error(err)
  process.exit(1)
})
