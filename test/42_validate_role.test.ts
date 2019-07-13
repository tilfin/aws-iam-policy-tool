import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/validate_role'

describe('validate_role on change stage', () => {
  const targetDir = path.resolve(__dirname, './fixtures/change/roles')

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
