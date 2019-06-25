import { Readable } from 'stream'
import { iam } from './iam'
import { IAM } from 'aws-sdk';

/**
 * ListStream
 *
 * incremental fetching target as readable stream
 */
abstract class ListStream<T> extends Readable {
	private params: any
	protected marker: string | undefined

  /**
   * Contructor
   *
   * @param {String} target - Policies | Roles
   * @param {Object} params - params of listPolicies
   */
  constructor(params: any = {}) {
    super({ objectMode: true, highWaterMark: 100 })
    this.params = params
    this.marker = undefined
  }

  _read(m: any) {
    const params = Object.assign({}, this.params)
    if (this.marker) params.Marker = this.marker

    this.pause()

    this._fetch(params)
    .then(() => {
      this.resume()
    })
    .catch((err: Error) => {
      this.emit('error', err)
    })
  }

  abstract async _fetch(params: any): Promise<void>
}

export class ListRoleStream extends ListStream<IAM.Role> {
  async _fetch(params: any): Promise<void> {
    const data = await iam.listRoles(params).promise()
    data.Roles.forEach((item: IAM.Role) => this.push(item))

    if (data.IsTruncated) {
      this.marker = data.Marker
    } else {
      this.marker = undefined
      this.push(null) // EOS
    }
  }
}

export class ListPolicyStream extends ListStream<IAM.Policy> {
  async _fetch(params: any): Promise<void> {
    const data = await iam.listPolicies(params).promise()
    data.Policies!.forEach((item: IAM.Policy) => this.push(item))

    if (data.IsTruncated) {
      this.marker = data.Marker
    } else {
      this.marker = undefined
      this.push(null) // EOS
    }
  }
}
