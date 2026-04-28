export default function(colorize: boolean) {
  if (colorize) {
    return {
      OK: ' \x1b[1;32mOK\x1b[0m ',
      NG: ' \x1b[1;31mNG\x1b[0m ',
      Skip: '\x1b[1;36mSkip\x1b[0m',
    }
  } else {
    return {
      OK: ' [OK] ',
      NG: ' [NG] ',
      Skip: '[Skip]',
    }
  }
}
