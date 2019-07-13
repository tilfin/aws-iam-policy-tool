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

  it('returns true', done => {
    const writer = writeArray((err, values) => {
      console.log(values)
      done(err)
    })
    main(outDir, "\-test$", { writer })
  })
})
