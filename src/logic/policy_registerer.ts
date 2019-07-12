import {
  getPolicyArnPrefix,
  PolicyEntry,
  PolicyFetcher,
} from '../aws/policy'
import { OK, NG, Skip, Result } from '../utils/result'
import { createPolicy, ArnType, deletePolicyVersion, createPolicyDefaultVersion } from '../aws/operation'


export class PolicyRegisterer {
	private _color: boolean;
	private _overwrite: boolean;
  private policyFetcher!: PolicyFetcher

  constructor(opts: any = {}) {
    this._color = !(opts['plain'] || false)
    this._overwrite = opts['overwrite'] || false
  }

  async prepare(): Promise<ArnType> {
    const arnPrefix = await getPolicyArnPrefix()
    this.policyFetcher = new PolicyFetcher(arnPrefix)
    return arnPrefix;
  }

  async register(entry: PolicyEntry): Promise<Result> {
    const { name } = entry
    try {
      await createPolicy(entry.toCreatePolicyParams(4))
      return OK('Created %1', name)
    } catch(err) {
      if (err.code === 'EntityAlreadyExists') {
        if (this._overwrite) {
          return this.updatePolicyVersion(entry)
        } else {
          return Skip('%1 already exists.', name)
        }
      } else if (err.code === 'MalformedPolicyDocument') {
        return NG('%1 is invalid Policy JSON format.', name)
      }
      throw err
    }
  }

  private async updatePolicyVersion(entry: PolicyEntry): Promise<Result> {
    const { name } = entry
    const localDocJson = entry.documentAsJson()
    const {
      oldestId: deleteVerId,
      count,
      currentPolicy: remotePolicy,
    } = await this.policyFetcher.getPolicyDefaultWithVersionInfo(name)

    if (localDocJson === remotePolicy.documentAsJson()) {
      return Skip('%1 not changed', name);
    } else {
      if (count === 5) {
        await deletePolicyVersion(remotePolicy.arn, deleteVerId)
        await createPolicyDefaultVersion(remotePolicy.arn, localDocJson)
        return OK(`Updated %1 and deleted the oldest ${deleteVerId}`, name)
      } else {
        await createPolicyDefaultVersion(remotePolicy.arn, localDocJson)
        return OK('Updated %1', name)
      }
    }
  }
}
