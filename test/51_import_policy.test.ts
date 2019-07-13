import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/import_policy'

describe('import_policy on change stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/change/policies')

  it('returns true', done => {
    const writer = writeArray((err, values) => {
      console.log(values)
      done(err)
    })
    main(inDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    }, {
      overwrite: true,
      writer
    })
  })
})
