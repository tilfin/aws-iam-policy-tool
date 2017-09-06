const Result = {};

Result.OK = function(message, diff) {
  return { status: 'OK', message, diff };
}

Result.NG = function(message, diff) {
  return { status: 'NG', message, diff };
}

Result.Skip = function(message, diff) {
  return { status: 'Skip', message, diff };
}

module.exports = Result;
