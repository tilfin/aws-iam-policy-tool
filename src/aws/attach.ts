import { iam } from './iam'
import { IAM } from 'aws-sdk'

export type RolePolicyPair = {
  RoleName: string
  PolicyArn: string
  PolicyName?: string
}

export async function diffAttachedPolicies(roleName: string, newPolicies: IAM.AttachedPolicy[]) {
  const params = {
    RoleName: roleName,
    MaxItems: 200
  }

  const data = await iam.listAttachedRolePolicies(params).promise()

  const unchangedPolicies: RolePolicyPair[] = []
  const detachingPolicies: RolePolicyPair[] = []

  data.AttachedPolicies!.forEach(policy => {
    if (containPolicy(newPolicies, policy)) {
      unchangedPolicies.push({
        RoleName: roleName,
        PolicyArn: policy.PolicyArn!,
      })
    } else {
      detachingPolicies.push({
        RoleName: roleName,
        PolicyArn: policy.PolicyArn!,
      })
    }
  })

  const attachingPolicies: RolePolicyPair[] = [];
  newPolicies.forEach(policy => {
    if (!containPolicy(unchangedPolicies, policy)) {
      attachingPolicies.push({
        RoleName: roleName,
        PolicyArn: policy.PolicyArn!,
      })
    }
  })

  return {
    attaching: attachingPolicies,
    detaching: detachingPolicies,
    unchanged: unchangedPolicies
  }
}

export function containPolicy(target: any[], expected: IAM.AttachedPolicy): boolean {
  for (let item of target) {
    if (item.PolicyArn === expected.PolicyArn) return true
  }
  return false
}
