import AWS from 'aws-sdk'
//require('extend-aws-error')(AWS)

export const iam: AWS.IAM = new AWS.IAM()
