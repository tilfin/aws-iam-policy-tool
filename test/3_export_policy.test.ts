const del = require('del')
import path from 'path'
import { assert } from 'chai'

import { main } from '../src/export_policy'

describe('export_policy', () => {
  const outDir = path.resolve(__dirname, './out/policies')

  before(async () => {
    await del([`${outDir}/*.json`])
  })

  it('returns true', async () => {
    const result = await main(outDir, "\-test$", {})
    return result
  })
})
