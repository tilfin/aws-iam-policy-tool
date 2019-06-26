import path from 'path'
import { assert } from 'chai'

import { main } from '../src/validate_role'

describe('validate_role on change stage', () => {
  const targetDir = path.resolve(__dirname, './fixtures/change/roles')

  it('returns false', async () => {
    const result = await main(targetDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    })
    return result
  })
})
