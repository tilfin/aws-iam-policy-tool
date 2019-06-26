const del = require('del')
import path from 'path'
import { assert } from 'chai'

import { main } from '../src/export_role'

describe('export_role on setup stage', () => {
  const outDir = path.resolve(__dirname, './out/roles')

  before(async () => {
    await del([`${outDir}/*.json`])
  })

  it('returns true', async () => {
    const result = await main(outDir, "\-test$", {})
    return result
  })
})
