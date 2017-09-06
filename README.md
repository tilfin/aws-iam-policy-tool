# AWS IAM tool

AWS IAM role/policy management command line tool

* Required Node.js 6.x or later

## Install

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

## Examples

### Export roles

```
$ awsiamtool export-role /tmp/myroles
```

![export-role screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_export-role.png)

### Export policies

```
$ awsiamtool export-policy /tmp/mypolicies
```

![export-policy screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_export-policy.png)

### Import roles

```
$ awsiamtool import-role -i <AWS Account ID> -e staging iam/roles
```

![import-role screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_import-role.png)

### Import policies

```
$ awsiamtool import-policy -i <AWS Account ID> -e staging iam/policies
```

![import-policy screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_import-policy.png)

### Validate roles

```
$ awsiamtool validate-role -i <AWS Account ID> -e staging iam/policies
```

![validate-role screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_validate-role.png)

### Validate policies

```
$ awsiamtool validate-policy -i <AWS Account ID> -e staging iam/policies
```

![validate-policy screen shot](https://raw.githubusercontent.com/wiki/tilfin/aws-iam-tool/images/ss_validate-policy.png)

### Delete policies

```
$ awsiamtool delete-policy "^myservice\-"
```
