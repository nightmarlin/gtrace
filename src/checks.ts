import * as djs from 'discord.js'
import { Command, getMembersWithRole, checkMemberHasRoleIn } from './helpers'
import { Config } from './configs'

export async function runCheck(params: string[], msg: djs.Message, cmd: Command, config: Config) {

  msg.reply(`processing...`)
  msg.channel.startTyping()

  await msg.guild.members.fetch()
  await msg.guild.roles.fetch()

  // Retrieve greeter channels
  console.log(`retrieving greeter channels...`);

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
  console.log(`retrieving greeters...`)
  let allGreeters = getMembersWithRole(config.greeterRole, msg.guild)

  // Subtract exceptions
  console.log(`removing exceptions`)
  let greetersToCheck: djs.GuildMember[] = []
  let greetersOnBreak: djs.GuildMember[] = []
  for (const g of allGreeters) {
    await g.fetch()
    if (!config.exceptionUsers.includes(g.id) // User is not config excluded by id
      && !checkMemberHasRoleIn(g, config.exceptionRoles) // User is not config excluded by role
      && !g.roles.cache.has(config.onBreakRole) // User is not on leniency
    ) {
      greetersToCheck.push(g)
    } else if (g.roles.cache.has(config.onBreakRole)) {
      greetersOnBreak.push(g)
    }
  }

  let msgs: djs.Message[] = []
  for (const chan of greeterChannels) {
    console.log(`getting last ${config.limitInDays} days of messages in #${chan.name} [this may take some time]`)
    msgs = [...msgs, ...await getLastWeekOfMessages(msg, chan, config)]
  }

  console.log(`filtering...`);
  let outOfLimit: djs.GuildMember[] = []
  let edgeOfLimit: djs.GuildMember[] = []
  for (const g of greetersToCheck) {

    if (!msgs.some(m => m.author.id === g.id)) {
      outOfLimit.push(g)
    } else if (!(
      msgs.filter(
        m => m.author.id === g.id
      ).some(
        m => m.createdAt >= new Date(Date.now() - ((config.limitInDays - 1) * 24 * 60 * 60 * 1000))
      ))) {
      edgeOfLimit.push(g)
    }
  }

  console.log(`generating report`)
  msg.channel.stopTyping()
  msg.reply(generateReport(outOfLimit, edgeOfLimit, greetersOnBreak, config))

}

function generateReport(outOfLimit: djs.GuildMember[], edgeOfLimit: djs.GuildMember[], onBreak: djs.GuildMember[], config: Config): string {
  let res = `**__Greeter Report - ${(new Date).toUTCString()}__**\n> *Using limit of ${config.limitInDays} days*\n\n`

  res += outOfLimit.length > 0 ? genReportBlock(`Remove Greeter From`, arrToString(outOfLimit)) : ``
  res += edgeOfLimit.length > 0 ? genReportBlock(`Warn For Next Round`, arrToString(edgeOfLimit)) : ``
  res += onBreak.length > 0 ? genReportBlock(`Currently On Break`, arrToString(onBreak)) : ``

  res += (!outOfLimit && !edgeOfLimit && !onBreak)
    ? `No greeters should be removed or warned. No greeters are on break`
    : ``

  return res
}

function arrToString(arr: djs.GuildMember[]): string {
  return arr.map(m => ` - **${m.user.username}#${m.user.discriminator}** (\`${m.user.id}\`)`).join(`\n`)
}

function genReportBlock(title: string, content: string): string {
  console.log(`generating '${title}' block`)

  let cb = '```'
  return `${cb}md\n# ${title}\n${cb}\n${content}\n`
}

//TODO
async function getMessagesBeforeOldest(oldestMsg: djs.Message, channel: djs.TextChannel): Promise<djs.Message[]> {
  // console.log(`fetching messages older than ${oldestMsg.createdAt.toUTCString()}...`)

  let res = await channel.messages.fetch({ before: oldestMsg.id })
  return res.array()
}

async function getLastWeekOfMessages(msg: djs.Message, channel: djs.TextChannel, config: Config): Promise<djs.Message[]> {

  let res: djs.Message[] = []
  let weekAgo: Date = new Date(Date.now() - (config.limitInDays * 24 * 60 * 60 * 1000))

  while (!res.some(m => m.createdAt < weekAgo)) {
    // Get messages before oldest msg
    let oldest: djs.Message = res.length === 0 ? msg : res[0]
    let incoming = await getMessagesBeforeOldest(oldest, channel)

    // Import incoming and sort [0]Oldest - [n]Newest
    res.push(...incoming)
    res = res.sort((a, b) => a.createdTimestamp - b.createdTimestamp)

    // console.log(`fetched ${incoming.length} messages, current oldest: ${res[0].createdAt.toUTCString()}`);
  }

  return res
}