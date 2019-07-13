import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'

import { main } from '../src/validate_policy'

describe('validate_policy on change stage', () => {
  const targetDir = path.resolve(__dirname, './fixtures/change/policies')

  it('succeeds with valid results', async () => {
    let values: any[]
    const writer = writeArray((_, vals) => { values = vals })

    await main(targetDir, {
      ENV: 'test',
      ACCOUNT_ID: process.env.ACCOUNT_ID,
    }, {
      plain: true,
      writer
    })

    assert.deepEqual(values.shift(), {
      status: 'NG',
      message: '%1 is invalid.',
      target: 'baz-dynamodb-items-test',
      diff: `\
 {
   Statement: [
     {
       Action: [
         "dynamodb:BatchGetItem"
         "dynamodb:BatchWriteItem"
-        "dynamodb:PutItem"
-        "dynamodb:Query"
         "dynamodb:UpdateItem"
       ]
     }
+    {
+      Effect: "Deny"
+      Action: [
+        "dynamodb:DeleteTable"
+      ]
+      Resource: "arn:aws:dynamodb:ap-northeast-1:633772696324:table/baz-dynamodb-items-test"
+    }
   ]
 }
`
    })

    assert.deepEqual(values.shift(), {
      status: 'NG',
      message: '%1 does not exist.',
      target: 'baz-dynamodb-users-test',
      diff: undefined
    })
  })
})
