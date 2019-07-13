import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/import_policy'

describe('import_policy on change stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/change/policies')

  it('succeeds with valid results', async () => {
    let values: any[]
    const writer = writeArray((_, vals) => { values = vals })

    await main(inDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    }, {
      overwrite: true,
      writer
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Updated %1',
      target: 'baz-dynamodb-items-test',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'NG',
      message: '%1 is invalid Policy JSON format.',
      target: 'baz-dynamodb-items-v2',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Created %1',
      target: 'baz-dynamodb-users-test',
      diff: undefined
    })
  })
})
