const del = require('del')
import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/export_role'

describe('export_role on setup stage', () => {
  const outDir = path.resolve(__dirname, './out/roles')

  before(async () => {
    await del([`${outDir}/*.json`])
  })

  it('succeeds with valid results', async () => {
    let values: any[]
    const writer = writeArray((_, vals) => {
      values = vals.sort((a, b) => a.target.localeCompare(b.target))
    })

    await main(outDir, "\-test|qux\-lambda\-role$", { writer })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Wrote %1',
      target: 'bar-lambda-converter-test.json',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Wrote %1',
      target: 'baz-ecs-api-test.json',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Wrote %1',
      target: 'foo-ec2-admin-test.json',
      diff: undefined
    })
  })
})
