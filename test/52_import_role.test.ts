import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/import_role'

describe('import_role for change stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/change/roles')

  it('succeeds with valid results', async () => {
    let values: any[]
    const writer = writeArray((_, vals) => {
      values = vals.sort((a, b) => [].concat(a.target)[0].localeCompare([].concat(b.target)[0]))
    })

    await main(inDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    }, { writer })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Detached %1 on %2',
      target: ['baz-dynamodb-items-test', 'baz-ecs-api-test'],
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Attached %1 on %2',
      target: ['baz-dynamodb-users-test', 'baz-ecs-api-test'],
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'Skip',
      message: 'Role: %1 already exists.',
      target: 'baz-ecs-api-test'
    })
  })
})
