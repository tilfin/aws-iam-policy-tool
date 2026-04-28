import {
  DeletePolicyCommand,
  DeletePolicyVersionCommand,
  Policy,
} from '@aws-sdk/client-iam'
import { OK, NG, Skip, Result } from '../utils/result'
import { listPolicyVersions } from '../aws/operation'
import { iam } from '../aws/iam'
import { asError } from '../utils/error'

export class PolicyCleaner {
  constructor(opts: any = {}) {
  }

  async delete(policy: Policy): Promise<Result[]> {
    const results: Result[] = []

    try {
      const policyVersions = await listPolicyVersions(policy.Arn!)
      for (const policyVersion of policyVersions) {
        if (!policyVersion.IsDefaultVersion) {
          await this.deletePolicyVersion(policy.Arn!, policyVersion.VersionId!)
          results.push(OK('Deleted %1 %2', [policy.PolicyName!, policyVersion.VersionId!]))
        }
      }

      await this.deletePolicy(policy)
      results.push(OK('Deleted %1', policy.PolicyName!))

      return results
    } catch (err) {
      const error = asError(err)
      if (error.code === 'DeleteConflict') {
        results.push(NG(
          'Failed to delete %1 attached on some roles',
          policy.PolicyName!
        ))
        return results
      }
      throw err
    }
  }

  private async deletePolicy(policy: Policy) {
    return iam.send(new DeletePolicyCommand({ PolicyArn: policy.Arn! }))
  }

  private async deletePolicyVersion(arn: string, versionId: string) {
    const params = {
      PolicyArn: arn,
      VersionId: versionId,
    }
    return iam.send(new DeletePolicyVersionCommand(params))
  }
}
