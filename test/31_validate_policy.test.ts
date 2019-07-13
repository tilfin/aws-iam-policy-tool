import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/validate_policy'

describe('validate_policy on setup stage', () => {
  it('returns true', done => {
    const writer = writeArray((err, values) => {
      console.log(values)
      done(err)
    })
    main(path.resolve(__dirname, './out/policies'), {}, { writer })
  })
})
