import * as djs from 'discord.js'
import { Config } from './configs'
import { removeRole } from './helpers'

export type FollowUpInfo = {
  refDate: Date
  replyTo: djs.Message

  toRemove: djs.GuildMember[]
  toAlert: djs.GuildMember[]
}

async function runRemoval(g: djs.GuildMember, refDate: Date, config: Config) {

  let dmc = await g.createDM()
    .catch(err => {
      console.error(`unable to create dm channel with ${g.user.username}#${g.user.discriminator} (${g.id}) due to: ${err}`)
      return <djs.DMChannel>undefined
    })

  if (dmc !== undefined) {
    dmc.send(generateText(g, true, refDate, config), { allowedMentions: { parse: [] } })
      .catch(err => console.error(`unable to send role removal dm due to: ${err}`))
  }

  if (config.shouldTryToEditRoles) {
    removeRole(g.id, config.greeterRole, g.guild)
  }
}
async function runAlert(g: djs.GuildMember, refDate: Date, config: Config) {
  let dmc = await g.createDM()
    .catch(err => {
      console.error(`unable to create dm channel with ${g.user.username}#${g.user.discriminator} (${g.id}) due to: ${err}`)
      return <djs.DMChannel>undefined
    })

  if (dmc !== undefined) {
    dmc.send(generateText(g, true, refDate, config), { allowedMentions: { parse: [] } })
      .catch(err => console.error(`unable to send role removal dm due to: ${err}`))
  }
}

/**
 * Generates the correct text for each user
 * @param g The greeter to dm
 * @param removeOrAlert True: Role will be removed | False: Give an alert
 * @param refDate The date we've been comparing from
 * @param config The config object
 */
function generateText(g: djs.GuildMember, removeOrAlert: Boolean, refDate: Date, config: Config): string {
  let res = `hello ${g.user.username}!
your last greet in **${g.guild.name}** was ${removeOrAlert ? `before` : `just after`} ${refDate.getFullYear()}-${refDate.getMonth()}-${refDate.getDate()}\n`

  if (removeOrAlert) {
    res += `as such, we have removed the role from you, but feel free to ask for it back if you feel you'll be more active!\n`
  } else {
    res += `as this is on the edge of the ${config.limitInDays} day limit, the role has not been removed. just consider this to be a head's up!!\n`
  }

  res += `> this was an automated message - if you have any questions please contact server staff!`
  return res
}

/**
 * Follow up from a report
 * @param fui The follow up data to use
 * @param config The bot config object
 */
export function runFollowUps(fui: FollowUpInfo, config: Config) {
  fui.replyTo.channel.startTyping()

  for (const g of fui.toAlert) {
    console.log(`alerting ${g.user.username}#${g.user.discriminator} (${g.id})`)
    runAlert(g, fui.refDate, config)
  }
  for (const g of fui.toRemove) {
    console.log(`removing ${g.user.username}#${g.user.discriminator} (${g.id})`)
    runRemoval(g, fui.refDate, config)
  }

  fui.replyTo.channel.stopTyping()
  fui.replyTo.reply(`follow-ups complete!`)
    .catch(err => console.log(`unable to send follow up completion message due to: ${err}`))

}
