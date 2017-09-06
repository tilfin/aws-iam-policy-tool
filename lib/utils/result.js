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

Result.Skip = function(message, target) {
  return { status: 'Skip', message, target };
}

module.exports = Result;
