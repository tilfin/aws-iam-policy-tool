import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/import_role'

describe('import_role on terminate stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/terminate/roles')

  context('when roles have no attached policies', () => {
    it('detaches policies from roles', async () => {
      let values: any[]
      const writer = writeArray((_, vals) => { values = vals })
  
      await main(inDir, {
        ENV: 'test',
        ACCOUNT_ID: process.env.ACCOUNT_ID,
      }, { writer })
      
      assert.deepEqual(values.shift(), {
        status: 'Skip',
        message: 'Role: %1 already exists.',
        target: 'bar-lambda-converter-test'
      })

      assert.deepEqual(values.shift(), {
        status: 'OK',
        message: 'Detached %1 on %2',
        target: ['bar-logs-lambda-test', 'bar-lambda-converter-test'],
        diff: undefined
      })

      assert.deepEqual(values.shift(), {
        status: 'Skip',
        message: 'Role: %1 already exists.',
        target: 'baz-ecs-api-test'
      })

      assert.deepEqual(values.shift(), {
        status: 'OK',
        message: 'Detached %1 on %2',
        target: ['baz-dynamodb-users-test', 'baz-ecs-api-test'],
        diff: undefined
      })

      assert.deepEqual(values.shift(), {
        status: 'Skip',
        message: 'Role: %1 already exists.',
        target: 'foo-ec2-admin-test'
      })

      assert.deepEqual(values.shift(), {
        status: 'OK',
        message: 'Detached %1 on %2',
        target: ['foo-s3-logs-test', 'foo-ec2-admin-test'],
        diff: undefined
      })

      assert.deepEqual(values.shift(), {
        status: 'OK',
        message: 'Detached %1 on %2',
        target: ['foo-s3-storage-test', 'foo-ec2-admin-test'],
        diff: undefined
      })      
    })
  })
})
