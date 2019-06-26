import path from 'path'
import { assert } from 'chai'

import { main } from '../src/validate_policy'

describe('validate_policy on setup stage', () => {
  it('returns true', async () => {
    const result = await main(path.resolve(__dirname, './out/policies'), {})
    return result
  })
})
