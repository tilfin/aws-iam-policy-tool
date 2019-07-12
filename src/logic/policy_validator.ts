const jsonDiff = require('json-diff')

import { PolicyEntry, getPolicyArnPrefix, PolicyFetcher } from "../aws/policy"
import { NG, Result, OK } from "../utils/result"
import { ArnType } from "../aws/operation";


export class PolicyValidator {
	public _color: boolean
	public _invalidCnt: number
  private policyFetcher!: PolicyFetcher

  constructor(opts: any = {}) {
    this._color = !(opts['plain'] || false)
    this._invalidCnt = 0
  }

  async prepare(): Promise<ArnType> {
    const arnPrefix = await getPolicyArnPrefix()
    this.policyFetcher = new PolicyFetcher(arnPrefix)
    return arnPrefix
  }

  async validate(entry: PolicyEntry): Promise<Result> {
    const { name, document: localDocument } = entry;
    try {
      const { currentPolicy: remotePolicy } = await this.policyFetcher.getPolicyDefaultWithVersionInfo(name)
      if (!remotePolicy) {
        this._invalidCnt++
        return NG('%1 does not exist.', name)
      }

      const df = jsonDiff.diffString(remotePolicy.document, localDocument, { color: this._color })
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
