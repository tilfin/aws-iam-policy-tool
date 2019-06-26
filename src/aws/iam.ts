import AWS from 'aws-sdk'

const params: AWS.IAM.ClientConfiguration = {}
if (process.env.NODE_ENV === 'test') {
  require('extend-aws-error')(AWS)
  params.region = 'us-east-1'
  params.endpoint = 'http://localhost:4593'
}

export const iam: AWS.IAM = new AWS.IAM(params)
