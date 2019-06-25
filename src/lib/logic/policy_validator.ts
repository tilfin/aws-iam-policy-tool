'use strict'

import { MyPolicyDoc } from "../aws/policy";

const jsonDiff = require('json-diff')
const policy = require('../aws/policy')
const Result = require('../utils/result')


export class PolicyValidator {
	public _color: boolean
	public _invalidCnt: number

  constructor(opts: any = {}) {
    this._color = !(opts['plain'] || false)
    this._invalidCnt = 0
  }

  async validate({ name, document }: MyPolicyDoc) {
    try {
      const arnPrefix = await policy.getPolicyArnPrefix()
      const [currentPolicy, _] = await policy.getPolicyDefaultWithVersionInfoByArn(`${arnPrefix}/${name}`)
      if (!currentPolicy) {
        this._invalidCnt++
        return Result.NG('%1 does not exist.', name)
      }

      const currentDoc = JSON.parse(decodeURIComponent(currentPolicy.document))
      const df = jsonDiff.diffString(currentDoc, document, { color: this._color })
      if (df) {
        this._invalidCnt++
        return Result.NG('%1 is invalid.', name, df)
      } else {
        return Result.OK(name)
      }
    } catch(err) {
      if (err.code === 'NoSuchEntity') {
        return Result.NG('%1 does not exist.', name)
      }
      throw err
    }
  }

  isValid(): boolean {
    return this._invalidCnt === 0
  }
}
