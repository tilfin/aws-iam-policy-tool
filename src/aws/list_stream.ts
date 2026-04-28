import { Readable } from 'stream'
import { iam } from './iam'
import {
  ListPoliciesCommand,
  ListRolesCommand,
  Policy,
  Role,
} from '@aws-sdk/client-iam'

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

  abstract _fetch(params: any): Promise<void>
}

export class ListRoleStream extends ListStream<Role> {
  async _fetch(params: any): Promise<void> {
    const data = await iam.send(new ListRolesCommand(params))
    data.Roles?.forEach((item: Role) => this.push(item))

    if (data.IsTruncated) {
      this.marker = data.Marker
    } else {
      this.marker = undefined
      this.push(null) // EOS
    }
  }
}

export class ListPolicyStream extends ListStream<Policy> {
  async _fetch(params: any): Promise<void> {
    const data = await iam.send(new ListPoliciesCommand(params))
    data.Policies?.forEach((item: Policy) => this.push(item))

    if (data.IsTruncated) {
      this.marker = data.Marker
    } else {
      this.marker = undefined
      this.push(null) // EOS
    }
  }
}
