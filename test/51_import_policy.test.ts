import path from 'path'
import { assert } from 'chai'

import { main } from '../src/import_policy'

describe('import_policy on change stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/change/policies')

  it('returns true', async () => {
    const result = await main(inDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    }, {
      overwrite: true
    })
    return result
  })
})
