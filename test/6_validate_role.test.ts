import path from 'path'
import { assert } from 'chai'

import { main } from '../src/validate_role'

describe('validate_role', () => {
  it('returns true', async () => {
    const result = await main(path.resolve(__dirname, './out/roles'), {})
    return result
  })
})
