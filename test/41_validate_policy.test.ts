import path from 'path'
import { assert } from 'chai'

import { main } from '../src/validate_policy'

describe('validate_policy on change stage', () => {
  const targetDir = path.resolve(__dirname, './fixtures/change/policies')

  it('returns false', async () => {
    const result = await main(targetDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    })
    return result
  })
})
