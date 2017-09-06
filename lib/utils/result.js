const Result = {};

Result.OK = function(message, target, diff) {
  if (target === undefined) {
    target = message;
    message = '%1';
  }
  return { status: 'OK', message, target, diff };
}

Result.NG = function(message, target, diff) {
  return { status: 'NG', message, target, diff };
}

Result.Skip = function(message, diff) {
  return { status: 'Skip', message, target, diff };
}

module.exports = Result;
