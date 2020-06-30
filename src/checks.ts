import * as djs from 'discord.js'
import { Command, getMembersWithRole } from './helpers'
import { Config } from './configs'

export async function runCheck(params: string[], msg: djs.Message, cmd: Command, config: Config) {

  msg.reply(`processing...`)

  await msg.guild.members.fetch()
  await msg.guild.roles.fetch()

  // Retrieve greeter channels
  let greeterChannels: djs.TextChannel[] = []
  for (const cId of config.greeterChannels) {
    // Retrience
    let chan: djs.TextChannel = await (<djs.TextChannel>msg.guild.channels.resolve(cId)).fetch()
      .catch(err => {
        console.error(`Unable to retrieve channel ${cId} due to: ${err}`)
        return undefined
      })
      .then(c => c)

    // If unable to resolve, skip
    if (chan !== undefined) {
      greeterChannels.push(chan)
    }
  }
  if (greeterChannels.length === 0) {
    msg.reply(`Unable to complete operation: no greeter channels were found`)
      .catch(err => console.error(`unable to send greeter channel resolve error message due to: ${err}`))
    return
  }

  // Get greeters
  let allGreeters = getMembersWithRole(config.greeterRole, msg.guild)

  // Get exceptions
  let exceptedGreeters: djs.GuildMember[] = []
  for (const rId of config.exceptionRoles) {
    exceptedGreeters.push(...getMembersWithRole(rId, msg.guild))
  }
  for (const uId of config.exceptionUsers) {
    let m = msg.guild.members.resolve(uId)
    if (m) {
      exceptedGreeters.push(m)
    }
  }

  // Subtract exceptions
  let greetersToCheck = allGreeters.filter(g => !exceptedGreeters.includes(g) && !g.roles.cache.has(config.leniencyRole))

  // TODO: Get 2 weeks of messages from all channels
  let msgs: djs.Message[] = []

}

//TODO
function getLastWeekOfMessages(msg: djs.Message, channel: djs.TextChannel): djs.Message[] {
  return []
}