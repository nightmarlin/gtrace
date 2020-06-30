import * as djs from 'discord.js'
import { getIfRoleOrUser, Command, sendBadRequestMessage, addRole, removeRole, getMembersWithRole } from './helpers'
import { Config } from './configs'
import { config } from 'process'

export async function leniencyHandler(params: string[], msg: djs.Message, cmd: Command, config: Config) {

  if (params.length === 2 && params[1] === 'get') {

    let leniencies = findLeniencies(msg, config).map(l => {
      return ` - **${l.user.username}${l.user.discriminator}** (\`${l.id}\`)`
    }).join(`\n`)
    let msgTxt: string = `The following users are currently on leniency:\n\n${leniencies}`
    msg.reply(msgTxt)

    return
  } else if (params.length !== 3 || getIfRoleOrUser(params[2], msg.guild) !== `user`) {
    sendBadRequestMessage(msg, cmd, 2)
    return
  }

  switch (params[1]) {
    case `add`:
      addLeniency(params[2], msg, config)
      sendSuccess(msg)
      break

    case `remove`:
      removeLeniency(params[2], msg, config)
      sendSuccess(msg)
      break

    default:
      sendBadRequestMessage(msg, cmd, 2)
      break
  }

}

function findLeniencies(msg: djs.Message, config: Config): djs.GuildMember[] {
  return getMembersWithRole(config.leniencyRole, msg.guild)
}

function sendSuccess(msg: djs.Message) {
  msg.reply(`Leniency updated!`)
    .catch(err => console.error(`unable to send leniency change success message due to: ${err}`))
}

function addLeniency(userId: string, msg: djs.Message, config: Config) {
  addRole(userId, config.leniencyRole, msg.guild)
}

function removeLeniency(userId: string, msg: djs.Message, config: Config) {
  removeRole(userId, config.leniencyRole, msg.guild)
}