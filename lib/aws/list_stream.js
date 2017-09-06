'use strict';

const Readable = require('stream').Readable;
const iam = require('./iam');

/**
 * ListStream
 *
 * incremental fetching target as readable stream
 */
class ListStream extends Readable {

  /**
   * Contructor
   *
   * @param {String} target - Policies | Roles
   * @param {Object} params - params of listPolicies
   */
  constructor(target, params) {
    super({ objectMode: true, highWaterMark: 100 });
    this.target = target;
    this.params = params || {};
    this.marker = null;
  }

  _read(m) {
    const params = Object.assign({}, this.params);
    if (this.marker) params.Marker = this.marker;

    this.pause();

    const method = iam['list' + this.target];
    return method.call(iam, params).promise()
    .then(data => {
      const items = data[this.target];
      items.forEach(item => this.push(item));

      if (data.IsTruncated) {
        this.marker = data.Marker;
      } else {
        this.marker = null;
        this.push(null); // EOS
      }

      this.resume();
    })
    .catch(err => {
      this.emit('error', err);
    });
  }
}

class ListRoleStream extends ListStream {
  constructor(params) {
    super('Roles', params);
  }
}

class ListPolicyStream extends ListStream {
  constructor(params) {
    super('Policies', params);
  }
}


module.exports = {
  ListPolicyStream,
  ListRoleStream,
}
