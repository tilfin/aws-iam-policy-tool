import path from 'path'
import { assert } from 'chai'

import { main } from '../src/import_role'

describe('import_role on terminate stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/terminate/roles')

  context('when roles have no attached policies', () => {
    it('detaches policies from roles', async () => {
      const result = await main(inDir, {
        ENV: 'test',
        ACCOUNT_ID: process.env.ACCOUNT_ID,
      })
      return result
    })
  })
})
