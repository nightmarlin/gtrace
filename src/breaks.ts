import * as djs from 'discord.js'
import { getIfRoleOrUser, Command, sendBadRequestMessage, addRole, removeRole, getMembersWithRole } from './helpers'
import { Config } from './configs'

export async function onBreakHandler(params: string[], msg: djs.Message, cmd: Command, config: Config) {

  if (params.length >= 2 && params[1] === 'get') {

    let msgTxt = ""

    if (params.length === 3 && getIfRoleOrUser(params[2], msg.guild) === `user`) {
      let u = msg.guild.members.resolve(params[2])
      msgTxt = `**${u.user.username}#${u.user.discriminator}** is ${u.roles.cache.has(config.onBreakRole) ? "" : "not"} currently on leniency`
    } else {
      let leniencies = findLeniencies(msg, config).map(l => {
        return ` - **${l.user.username}#${l.user.discriminator}** (\`${l.id}\`)`
      }).join(`\n`)
      msgTxt = `The following users are currently on leniency:\n\n${leniencies}`
    }

    msg.reply(msgTxt)

    return
  } else if (params.length !== 3 || getIfRoleOrUser(params[2], msg.guild) !== `user`) {
    sendBadRequestMessage(msg, cmd, 2)
    return
  } else if (!config.shouldTryToEditRoles) {
    msg.reply(`Adding and removing leniencies has been disabled - ` +
      `try setting <@&${config.onBreakRole}> with another bot or doing it manually`)
      .catch(err => console.error(`unable to send leniency management disabled message due to: ${err}`))
    return
  }

  let id = params[2]
  let success: Boolean = false

  switch (params[1]) {
    case `add`:
      success = await addLeniency(id, msg, config)
      if (success) {
        sendSuccess(msg, id)
      } else {
        sendFailure(msg, id)
      }
      break

    case `remove`:
      success = await removeLeniency(id, msg, config)
      if (success) {
        sendSuccess(msg, id)
      } else {
        sendFailure(msg, id)
      }
      break

    default:
      sendBadRequestMessage(msg, cmd, 2)
      break
  }

}

function findLeniencies(msg: djs.Message, config: Config): djs.GuildMember[] {
  return getMembersWithRole(config.onBreakRole, msg.guild)
}

function sendSuccess(msg: djs.Message, id: string) {
  msg.reply(`Leniency updated for <@${id}> (\`${id}\`)!`)
    .catch(err => console.error(`unable to send leniency change success message due to: ${err}`))
}

function sendFailure(msg: djs.Message, id: string) {
  msg.reply(`Unable to update leniency for <@${id}> (\`${id}\`) :pensive:`)
    .catch(err => console.error(`unable to send leniency change success message due to: ${err}`))
}

async function addLeniency(userId: string, msg: djs.Message, config: Config): Promise<Boolean> {
  return addRole(userId, config.onBreakRole, msg.guild)
}

async function removeLeniency(userId: string, msg: djs.Message, config: Config): Promise<Boolean> {
  return removeRole(userId, config.onBreakRole, msg.guild)
}