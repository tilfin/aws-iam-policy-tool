# AWS IAM tool

## Usage

```
$ aws-iam-tool --help

  Usage: aws-iam-tool [options] [command]

  AWS IAM export/import policy/role management tool


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    export-policy <dir> <matcher>  export polies to target directory
    export-role <dir> <matcher>    export roles to target directory
    import-policy <dir>            import policies from target directory
    import-role <dir>              import policies from target directory
    delete-policy <matcher>        delete policies specified regular expression matches
    help [cmd]                     display help for [cmd]
```
