import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/validate_role'

describe('validate_role on change stage', () => {
  const targetDir = path.resolve(__dirname, './fixtures/change/roles')

  it('succeeds with valid results', async () => {
    let values: any[]
    const writer = writeArray((_, vals) => { values = vals })

    await main(targetDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    }, { writer })

    assert.deepEqual(values.shift(), {
      status: 'NG',
      message: 'Role: %1 does not have Policy: %2.',
      target: ['baz-ecs-api-test', 'baz-dynamodb-users-test'],
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'NG',
      message: 'Role: %1 have Policy: %2 not required.',
      target: ['baz-ecs-api-test', 'baz-dynamodb-items-test'],
      diff: undefined
    })
  })
})
