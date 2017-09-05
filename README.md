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

### Export policies

```
$ awsiamtool export-policy /tmp/mypolicies
```

### Import roles

```
$ awsiamtool import-role iam/roles
```

### Import policies

```
$ awsiamtool import-policy iam/policies
```

### Validate policies

```
$ awsiamtool validate-policy iam/policies
```

### Delete policies

```
$ awsiamtool delete-policy "^myservice\-"
```
