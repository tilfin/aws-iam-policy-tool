const del = require('del')
import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/export_policy'

describe('export_policy on setup stage', () => {
  const outDir = path.resolve(__dirname, './out/policies')

  before(async () => {
    await del([`${outDir}/*.json`])
  })

  it('succeeds with valid results', async () => {
    let values: any[]
    const writer = writeArray((_, vals) => {
      values = vals.sort((a, b) => a.target.localeCompare(b.target))
    })

    await main(outDir, '\-test|^AWSLambdaBasicExecutionRole\-b3c4ecbd\-319d\-475f$', { writer })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Wrote %1',
      target: 'AWSLambdaBasicExecutionRole-b3c4ecbd-319d-475f.json',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Wrote %1',
      target: 'bar-logs-lambda-test.json',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Wrote %1',
      target: 'baz-dynamodb-items-test.json',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Wrote %1',
      target: 'foo-s3-logs-test.json',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Wrote %1',
      target: 'foo-s3-storage-test.json',
      diff: undefined
    })
  })
})
