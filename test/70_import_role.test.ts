import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/import_role'

describe('import_role on terminate stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/terminate/roles')

  context('when roles have no attached policies', () => {
    it('detaches policies from roles', done => {
      const writer = writeArray((err, values) => {
        console.log(values)
        done(err)
      })
      main(inDir, {
        ENV: 'test',
        ACCOUNT_ID: process.env.ACCOUNT_ID,
      }, { writer })
    })
  })
})
