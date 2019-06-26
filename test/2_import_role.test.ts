import path from 'path'
import { assert } from 'chai'

import { main } from '../src/import_role'

describe('import_role', () => {
  const inDir = path.resolve(__dirname, './fixtures/setup/roles')

  it('returns true', async () => {
    const result = await main(inDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    })
    return result
  })
})
