import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/validate_policy'

describe('validate_policy on change stage', () => {
  const targetDir = path.resolve(__dirname, './fixtures/change/policies')

  it('returns false', done => {
    const writer = writeArray((err, values) => {
      console.log(values)
      done(err)
    })
    main(targetDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    }, { writer })
  })
})
