const jsonDiff = require('json-diff')

import { LocalPolicyFile, getPolicyArnPrefix, getPolicyDefaultWithVersionInfoByArn } from "../aws/policy"
import { NG, Result, OK } from "../utils/result"


export class PolicyValidator {
	public _color: boolean
	public _invalidCnt: number

  constructor(opts: any = {}) {
    this._color = !(opts['plain'] || false)
    this._invalidCnt = 0
  }

  async validate({ name, document }: LocalPolicyFile): Promise<Result> {
    try {
      const arnPrefix = await getPolicyArnPrefix()
      const { currentPolicy } = await getPolicyDefaultWithVersionInfoByArn(`${arnPrefix}/${name}`)
      if (!currentPolicy) {
        this._invalidCnt++
        return NG('%1 does not exist.', name)
      }

      const currentDoc = JSON.parse(decodeURIComponent(currentPolicy.document))
      const df = jsonDiff.diffString(currentDoc, document, { color: this._color })
      if (df) {
        this._invalidCnt++
        return NG('%1 is invalid.', name, df)
      } else {
        return OK(name)
      }
    } catch(err) {
      if (err.code === 'NoSuchEntity') {
        return NG('%1 does not exist.', name)
      }
      throw err
    }
  }

  isValid(): boolean {
    return this._invalidCnt === 0
  }
}
