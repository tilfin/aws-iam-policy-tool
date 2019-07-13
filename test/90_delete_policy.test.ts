const glob = require('glob')
import util from 'util'
import path from 'path'
import { assert } from 'chai'
import { writeArray } from '@tilfin/stream-utils'
import { iam } from '../src/aws/iam'
import { main } from '../src/delete_policy'

describe('delete_policy on terminate stage', () => {
  before(async () => {
    const roleDir = path.resolve(__dirname, './fixtures/terminate/roles')
    const globPromise = util.promisify(glob)
    const files = await globPromise(`${roleDir}/*ENV.json`)
    const roleNames = files.map(file => {
      return file.split('/').pop().replace(/\-ENV\.json$/, '-test')
    })

    for (let roleName of roleNames) {
      if (roleName.match(/\-ec2\-/)) {
        await iam.removeRoleFromInstanceProfile({
          InstanceProfileName: roleName, RoleName: roleName
        }).promise()
        .catch(err => console.error(err.message))

        await iam.deleteRole({ RoleName: roleName }).promise()
        .catch(err => console.error(err.message))

        await iam.deleteInstanceProfile({ InstanceProfileName: roleName }).promise()
        .catch(err => console.error(err.message))
      } else {
        await iam.deleteRole({ RoleName: roleName }).promise()
        .catch(err => console.error(err.message))
      }
    }
  })

  it('returns true', done => {
    const writer = writeArray((err, values) => {
      console.log(values)
      done(err)
    })
    main("\-test$", { writer })
  })
})
