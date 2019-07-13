import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/validate_role'

describe('validate_role on setup stage', () => {
  it('succeeds with valid results', async () => {
    let values: any[]
    const writer = writeArray((_, vals) => { values = vals })

    await main(path.resolve(__dirname, './out/roles'), {}, { writer })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: '%1',
      target: 'bar-lambda-converter-test',
      diff: undefined
    })
    
    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: '%1',
      target: 'baz-ecs-api-test',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: '%1',
      target: 'foo-ec2-admin-test',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: '%1',
      target: 'qux-lambda-role',
      diff: undefined
    })
  })
})
