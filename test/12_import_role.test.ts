import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/import_role'

describe('import_role on setup stage', () => {
  const inDir = path.resolve(__dirname, './fixtures/setup/roles')

  it('succeeds with valid results', async () => {
    let values: any[]
    const writer = writeArray((_, vals) => { values = vals })

    await main(inDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    }, { writer })

    assert.deepEqual(values.shift(), {
      status: 'Skip',
      message: 'Role: %1 is AWS Service linked.',
      target: 'AWSServiceRoleForSupport'
    })

    assert.deepEqual(values.shift(), {
      status: 'Skip',
      message: 'Policy: %1 is already attached on Role: %2',
      target: [
        'aws-service-role/AWSSupportServiceRolePolicy',
        'AWSServiceRoleForSupport'
      ]
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Created Role: %1',
      target: 'bar-lambda-converter-test',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Attached %1 on %2',
      target: ['bar-logs-lambda-test', 'bar-lambda-converter-test'],
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Created Role: %1',
      target: 'baz-ecs-api-test',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Attached %1 on %2',
      target: ['baz-dynamodb-items-test', 'baz-ecs-api-test'],
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Created Role: %1',
      target: 'foo-ec2-admin-test',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Created InstanceProfile: %1',
      target: 'foo-ec2-admin-test',
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Added InstanceProfile: %1 to Role: %2',
      target: ['foo-ec2-admin-test', 'foo-ec2-admin-test'],
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Attached %1 on %2',
      target: ['foo-s3-storage-test', 'foo-ec2-admin-test'],
      diff: undefined
    })

    assert.deepEqual(values.shift(), {
      status: 'OK',
      message: 'Attached %1 on %2',
      target: ['foo-s3-logs-test', 'foo-ec2-admin-test'],
      diff: undefined
    })
  })
})
