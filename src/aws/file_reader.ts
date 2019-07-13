import path from 'path'
import { readFile } from '../utils/file'
import { substitute, parseJSON } from '../utils/varset'
import { PolicyEntry } from './policy'
import { ArnType } from './operation'
import { RoleEntry, RoleDocument } from './role'

export async function readRoleFile(
  filePath: string,
  varSet: any
): Promise<RoleEntry> {
  let name = ''
  try {
    name = path.basename(filePath, '.json')
    const text = await readFile(filePath)
    return new RoleEntry(name, parseJSON(text, varSet) as RoleDocument)
  } catch (err) {
    console.error(`Failed to read ${name}`)
    throw err
  }
}

export async function readPolicyFile(
  filePath: string,
  varSet: any,
  arnPrefix: ArnType
): Promise<PolicyEntry> {
  let name = ''
  try {
    name = path.basename(filePath, '.json')
    const text = await readFile(filePath)
    return new PolicyEntry(
      arnPrefix + '/' + substitute(name, varSet),
      parseJSON(text, varSet)
    )
  } catch (err) {
    console.error(`Failed to read ${name}`)
    throw err
  }
}
