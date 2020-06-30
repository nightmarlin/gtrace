import { AddRemoveUnion, getIfAddOrRemove, RoleUserUnion, getIfRoleOrUser, Command, sendBadRequestMessage, addRole, removeRole } from './helpers'
import { Config } from './configs'
import * as djs from 'discord.js'

/**
 * Adds or removes exceptions
 */

export async function exceptionHandler(params: string[], msg: djs.Message, cmd: Command, config: Config) {
  if (params.length !== 3) {
    sendBadRequestMessage(msg, cmd, 2)
    return
  }

  let addOrRemove: AddRemoveUnion = getIfAddOrRemove(params[1])
  let roleOrUser: RoleUserUnion = getIfRoleOrUser(params[2], msg.guild)

  if (roleOrUser == undefined || addOrRemove === undefined) {
    sendBadRequestMessage(msg, cmd, 2)
  } else if (addOrRemove === `add`) {
    config.addException(params[2], roleOrUser)
  } else {
    config.removeException(params[2], roleOrUser)
  }
}
