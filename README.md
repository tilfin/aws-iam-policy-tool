# AWS IAM tool

AWS IAM role/policy command line tool is useful to manage role and policy definitions as JSON files.

* Support a **Role** with only **Managed Policies**, without **Inline policies**
* Support the feature to substitute variables (ex `ACCOUNT_ID`, `ENV`) contained within definitions by given values
* Each JSON filename must be based on the name of *Role* or *Policy*.

## Definition files as JSON format

### Role

* `Role`
    * `RoleName`
    * `Path`
    * `AssumeRolePolicyDocument` manifests the trust relationship.
    * `Description` (optional)
* `AttachedPolicies` contains attached managed policies.

#### yourapp-ec2-api-ENV.json

```json
{
    "Role": {
        "RoleName": "yourapp-ec2-api-ENV",
        "Path": "/",
        "AssumeRolePolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
    },
    "AttachedPolicies": [
        {
            "PolicyName": "yourapp-s3-storage-ENV",
            "PolicyArn": "arn:aws:iam::ACCOUNT_ID:policy/yourapp-s3-storage-ENV"
        }
    ]
}
```

### Policy

A filename minus the extension (.json) decides the policy name.

#### yourapp-s3-storage-ENV.json

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::yourapp-storage-ENV/*"
        }
    ]
}
```

See an [example](example) of *Role* and *Policy* definitions.

## Install

* Require Node.js 6.x or later

```
$ git clone git@github.com:tilfin/aws-iam-tool.git
$ npm install -g ./aws-iam-tool
```

## Usage

```
$ awsiamtool --help

  Usage: awsiamtool [options] [command]

  AWS IAM export/import policy/role management tool


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    export-policy <dir> <pattern>  export polies to target directory
    export-role <dir> <pattern>    export roles to target directory
    import-policy <dir>            import policies from target directory
    import-role <dir>              import policies from target directory
    validate-role <dir>            validate roles with target directory
    delete-policy <pattern>        delete policies specified regular expression matches
    help [cmd]                     display help for [cmd]
```

### Common command options

```
  Options:

    -j, --json                         output result as JSON text
    -p, --plain                        output result as plain text
    -h, --help                         output usage information
```

### Set substitution variables

* `-i, --account-id [aws account id]`  set variable ACCOUNT_ID
* `-e, --env [environment]`            set variable ENV

The above variables are substituted by given values in the name of *role* file, the name of *policy* file and all values of their JSON.

### Export roles

```
$ awsiamtool export-role /tmp/current_roles
```

![export-role screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_export-role.png)

### Export policies

```
$ awsiamtool export-policy /tmp/current_policies
```

![export-policy screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_export-policy.png)

### Import roles


```
$ awsiamtool import-role -i <AWS Account ID> -e <Environment> exmaple/roles
```

![import-role screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_import-role.png)

### Import policies

* `-f, --overwrite` overwrite new content of policies. If it isn't specified, current policies are kept and new policy that does not exist is created.

```
$ awsiamtool import-policy -i <AWS Account ID> -e <Environment> [--overwrite] exmaple/policies
```

![import-policy screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_import-policy.png)

### Validate roles

```
$ awsiamtool validate-role -i <AWS Account ID> -e <Environment> exmaple/roles
```

![validate-role screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_validate-role.png)

### Validate policies

```
$ awsiamtool validate-policy -i <AWS Account ID> -e <Environment> exmaple/policies
```

![validate-policy screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_validate-policy.png)

### Delete policies

```
$ awsiamtool delete-policy "^myservice\-"
```
