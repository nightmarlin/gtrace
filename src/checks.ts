import * as djs from 'discord.js'
import { Command } from './helpers'
import { Config } from './configs'

type InactiveDays = 7 | 14

class GreeterLeniency {
  greeter: djs.GuildMember
  limit: InactiveDays

  constructor(g: djs.GuildMember, l: InactiveDays) {
    this.greeter = g
    this.limit = l
  }
}

export async function runCheck(params: string[], msg: djs.Message, cmd: Command, config: Config) {

  msg.reply(`processing...`)

  await msg.guild.members.fetch()
  await msg.guild.roles.fetch()

  // Remove warning role from all greeters
  let toRem = getMembersWithRole(config.warningRole, msg.guild)
  for (const g of toRem) {
    g.roles.remove(config.warningRole)
  }

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
    if (chan === undefined) {
      continue
    }

    greeterChannels.push(chan)
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
  let greetersToCheck = allGreeters.filter(g => !exceptedGreeters.includes(g))

  // Get leniency data
  let withLeniencies = greetersToCheck.map(g => new GreeterLeniency(g, g.roles.cache.has(config.leniencyRole) ? 14 : 7))

  // TODO: Get 2 weeks of messages from all channels
  let msgs: djs.Message[] = []

}

function getMembersWithRole(id: string, guild: djs.Guild): djs.GuildMember[] {
  let res: djs.GuildMember[] = []
  for (const m of guild.roles.resolve(id).members) {
    if (m) {
      res.push(m[1])
    }
  }
  return res
}

function getTwoWeeks() { }