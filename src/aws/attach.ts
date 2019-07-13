import { IAM } from 'aws-sdk'
import { getAttachedPoliciesByRole } from './operation'

export interface RolePolicyPair {
  RoleName: string;
  PolicyArn: string;
  PolicyName?: string;
}

export async function diffAttachedPolicies(
  roleName: string,
  newPolicies: IAM.AttachedPolicy[]
) {
  const currentPolicies = await getAttachedPoliciesByRole(roleName)

  const unchangedPolicies: RolePolicyPair[] = []
  const detachingPolicies: RolePolicyPair[] = []

  currentPolicies!.forEach(policy => {
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

  const attachingPolicies: RolePolicyPair[] = []
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
    unchanged: unchangedPolicies,
  }
}

export function containPolicy(
  target: any[],
  expected: IAM.AttachedPolicy
): boolean {
  for (let item of target) {
    if (item.PolicyArn === expected.PolicyArn) return true
  }
  return false
}
