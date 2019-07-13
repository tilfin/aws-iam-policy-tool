import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/validate_policy'

describe('validate_policy on setup stage', () => {
  it('succeeds with valid results', async () => {
    let values: any[]
    const writer = writeArray((_, vals) => { values = vals })

    await main(path.resolve(__dirname, './out/policies'), {}, { writer })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: '%1',
      target: 'AWSLambdaBasicExecutionRole-b3c4ecbd-319d-475f',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: '%1',
      target: 'bar-logs-lambda-test',
      diff: undefined
    })
    
    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: '%1',
      target: 'baz-dynamodb-items-test',
      diff: undefined
    })
    
    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: '%1',
      target: 'foo-s3-logs-test',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: '%1',
      target: 'foo-s3-storage-test',
      diff: undefined
    })
  })
})
