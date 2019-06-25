import {
  createPolicy,
  createPolicyDefaultVersion,
  deletePolicyVersion, Doc,
  getPolicyArnPrefix,
  getPolicyDefaultWithVersionInfoByArn,
  convertDocToJSON,
  MyPolicyDoc
} from '../aws/policy'
import { OK, NG, Skip, Result } from '../utils/result'


export class PolicyRegisterer {
	private _color: boolean;
	private _overwrite: boolean;

  constructor(opts: any = {}) {
    this._color = !(opts['plain'] || false)
    this._overwrite = opts['overwrite'] || false
  }

  async register({ name, document }: MyPolicyDoc): Promise<Result> {
    try {
      await createPolicy(name, document, 4)
      return OK('Created %1', name)
    } catch(err) {
      if (err.code === 'EntityAlreadyExists') {
        if (this._overwrite) {
          return this._updatePolicyVersion(name, document)
        } else {
          return Skip('%1 already exists.', name)
        }
      } else if (err.code === 'MalformedPolicyDocument') {
        return NG('%1 is invalid Policy JSON format.', name)
      }
      throw err
    }
  }

  async _updatePolicyVersion(name: string, doc: Doc): Promise<Result> {
    const docJSON = convertDocToJSON(doc, 4)

    const arnPrefix = await getPolicyArnPrefix()
    const [currentPolicy, versionInfo] = await getPolicyDefaultWithVersionInfoByArn(`${arnPrefix}/${name}`)

    if (docJSON === decodeURIComponent(currentPolicy.document)) {
      return Skip('%1 not changed', name);
    } else {
      if (versionInfo.count === 5) {
        const deleteVerId = versionInfo.oldestId;
        await deletePolicyVersion(currentPolicy.arn, deleteVerId)
        await createPolicyDefaultVersion(currentPolicy.arn, docJSON, 4)
        return OK(`Updated %1 and deleted the oldest ${deleteVerId}`, name)
      } else {
        await createPolicyDefaultVersion(currentPolicy.arn, docJSON, 4)
        return OK('Updated %1', name)
      }
    }
  }
}
