export default function(colorize: boolean) {
  if (colorize) {
    return {
      OK: ' \033[1;32mOK\033[0m ',
      NG: ' \033[1;31mNG\033[0m ',
      Skip: '\033[1;36mSkip\033[0m',
    }
  } else {
    return {
      OK: ' [OK] ',
      NG: ' [NG] ',
      Skip: '[Skip]',
    }
  }
}
