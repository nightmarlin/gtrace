import * as djs from 'discord.js'
import { Command, getMembersWithRole, checkMemberHasRoleIn } from './helpers'
import { Config } from './configs'

export async function runCheck(params: string[], msg: djs.Message, cmd: Command, config: Config) {

  msg.reply(`processing...`)
  msg.channel.startTyping()

  await msg.guild.members.fetch()
  await msg.guild.roles.fetch()

  // Retrieve greeter channels
  let greeterChannels: djs.TextChannel[] = []
  for (const cId of config.greeterChannels) {
    // Cast to text channel and get missing properties
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

  // Subtract exceptions
  let greetersToCheck: djs.GuildMember[] = []
  let greetersOnLeniency: djs.GuildMember[] = []
  for (const g of allGreeters) {
    await g.fetch()
    if (!config.exceptionUsers.includes(g.id) // User is not config excluded by id
      && !checkMemberHasRoleIn(g, config.exceptionRoles) // User is not config excluded by role
      && !g.roles.cache.has(config.leniencyRole) // User is not on leniency
    ) {
      greetersToCheck.push(g)
    } else if (g.roles.cache.has(config.leniencyRole)) {
      greetersOnLeniency.push(g)
    }
  }

  // TODO: Get 1 week of messages from each greeter channel
  let msgs: djs.Message[] = []
  for (const chan of greeterChannels) {
    msgs = [...msgs, ...await getLastWeekOfMessages(msg, chan, config)]
  }

  let outOfLimit: djs.GuildMember[] = []
  let edgeOfLimit: djs.GuildMember[] = []
  for (const g of greetersToCheck) {
    if (msgs.some(m => m.author.id === g.id)) {
      outOfLimit.push(g)
    } else if (msgs.some(
      m => (m.author.id === g.id)
        && (m.createdAt < new Date(Date.now() - ((config.limitInDays - 1) * 24 * 60 * 60 * 1000)))
    )) {
      edgeOfLimit.push(g)
    }
  }

  msg.channel.stopTyping()
  msg.reply(generateReport(outOfLimit, edgeOfLimit, greetersOnLeniency, config))

}

function generateReport(outOfLimit: djs.GuildMember[], edgeOfLimit: djs.GuildMember[], onLeniency: djs.GuildMember[], config: Config): string {
  let res = `***Greeter Report***\n\n*Using limit of ${config.limitInDays} days*\n`

  res += outOfLimit.length > 0 ? genReportBlock(`Remove Greeter From`, arrToString(outOfLimit)) : ``
  res += edgeOfLimit.length > 0 ? genReportBlock(`Warn For Next Round`, arrToString(edgeOfLimit)) : ``
  res += onLeniency.length > 0 ? genReportBlock(`Currently given leniency`, arrToString(onLeniency)) : ``

  res += (!outOfLimit && !edgeOfLimit && !onLeniency)
    ? `No greeters should be removed or warned. No greeters are on leniency`
    : ``

  return res
}

function arrToString(arr: djs.GuildMember[]): string {
  return arr.map(m => ` - **${m.user.username}#${m.user.discriminator}** - \`${m.user.id}\``).join(`\n`)
}

function genReportBlock(title: string, content: string): string {
  let cb = '```'
  return `${cb}md\n# ${title}\n${cb}\n${content}\n`
}

//TODO
async function getMessagesBeforeOldest(oldestMsg: djs.Message, channel: djs.TextChannel): Promise<djs.Message[]> {
  let res = await channel.messages.fetch({ before: oldestMsg.id })

  let processed: djs.Message[] = []
  for (const m of res.values()) {
    processed.push(m)
  }

  return processed
}

async function getLastWeekOfMessages(msg: djs.Message, channel: djs.TextChannel, config: Config): Promise<djs.Message[]> {
  let res: djs.Message[] = []
  let weekAgo: Date = new Date(Date.now() - ((config.limitInDays - 1) * 24 * 60 * 60 * 1000))

  while (!res.some(m => m.createdAt < weekAgo)) {
    // Get messages before oldest msg
    let oldest: djs.Message = res.length === 0 ? msg : res[0]
    let incoming = await getMessagesBeforeOldest(oldest, channel)

    // Remove messages older than a week
    incoming = incoming.filter(m => m.createdAt > weekAgo && !res.includes(m))

    // Import incoming and sort [0]Oldest - [n]Newest
    res.push(...incoming)
    res = res.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
  }

  return res
}