import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/validate_role'

describe('validate_role on setup stage', () => {
  it('returns true', done => {
    const writer = writeArray((err, values) => {
      console.log(values)
      done(err)
    })
    main(path.resolve(__dirname, './out/roles'), {}, { writer })
  })
})
