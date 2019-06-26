import path from 'path'
import { assert } from 'chai'

import { main } from '../src/import_role'

describe('import_role for change stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/change/roles')

  it('returns true', async () => {
    const result = await main(inDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    })
    return result
  })
})
