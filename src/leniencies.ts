import * as djs from 'discord.js'
import { getIfRoleOrUser, Command, sendBadRequestMessage, addRole, removeRole } from './helpers'
import { Config } from './configs'

export async function leniencyHandler(params: string[], msg: djs.Message, cmd: Command, config: Config) {
  if (params.length !== 3 || getIfRoleOrUser(params[2], msg.guild) !== `user`) {
    sendBadRequestMessage(msg, cmd, 2)
    return
  }

  switch (params[1]) {
    case `add`:
      addLeniency(params[2], msg, config)
      break

    case `remove`:
      removeLeniency(params[2], msg, config)
      break

    default:
      sendBadRequestMessage(msg, cmd, 2)
      break
  }

}

function addLeniency(userId: string, msg: djs.Message, config: Config) {
  addRole(userId, config.leniencyRole, msg.guild)

}

function removeLeniency(userId: string, msg: djs.Message, config: Config) {
  removeRole(userId, config.leniencyRole, msg.guild)
}