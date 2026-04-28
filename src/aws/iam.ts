import { IAMClient, IAMClientConfig } from '@aws-sdk/client-iam'

const params: IAMClientConfig = {}
if (process.env.NODE_ENV === 'test') {
  params.region = 'us-east-1'
  params.endpoint = 'http://localhost:4593'
}

export const iam = new IAMClient(params)
