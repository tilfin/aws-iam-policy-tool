import path from 'path'
import { assert } from 'chai'

import { main } from '../src/import_policy'

describe('import_policy on setup stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/setup/policies')

  it('returns true', async () => {
    const result = await main(inDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    })
    return result
  })
})
