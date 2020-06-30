// DiscordJs API
import * as djs from 'discord.js'
// FileSystem API
import * as fs from 'fs'

/**
 * The path to the config file
 */
const configPath = "./config.json"

/**
 * Defines the method signature of a command handler
 */
type CommandHandler = (params: string[], msg: djs.Message) => void

/**
 * Defines the role/user/inavlid result type
 */
type roleUserUnion = `role` | `user` | `invalid`
/**
 * Checks if the id given is a valid user or role ID
 * @param id The id to look up
 */
function getIfRoleOrUser(id: string): roleUserUnion {
  return "invalid"
}

/**
 * Defines the role/user/inavlid result type
 */
type addRemoveUnion = `add` | `remove` | `invalid`
/**
 * Checks if the value given is one of "add" or "remove"
 * @param toCheck The string to check
 */
function getIfAddOrRemove(toCheck: string): addRemoveUnion {
  if (toCheck === `add` || toCheck === `remove`) {
    return toCheck
  }
  return `invalid`
}

interface Command {
  /**
   *  Name(s) of the command
   */
  names: string[]
  /**
   *  The command description
   */
  description: string
  /**
   *  How to use the command
   */
  usage: string
  /**
   *  Command handler function
   */
  handler: CommandHandler
}

/**
 *  The array of commands available, populated in main()
 */
let commands: Command[] = undefined

// Config typings
interface Config {
  /**
   * The bot user token
   */
  token: string
  /**
   * The configured bot prefix
   */
  prefix: string
  /**
   * The greeter role id
   */
  greeterRole: string
  /**
   * The warning role id - added to greeters near the boundary
   */
  warningRole: string
  /**
   * The leniency role id - added to greeters we're making exceptions for
   */
  leniencyRole: string
  /**
   * The list of channels greeter activity should be checked in
   */
  greeterChannels: string[]
  /**
   * A list of roles the bot should override the checks on
   */
  exceptionRoles: string[]
  /**
   * A list of users the bot should override the checks on
   */
  exceptionUsers: string[]
}
/**
 * The config object
 */
let config: Config = require(configPath)

/**
 * Overwrites the current config file with the current stored config
 */
function writeConfigToFile() {
  let cfgAsJson = JSON.stringify(config)

  fs.writeFile(configPath, cfgAsJson, err => {
    console.log(`unable to save config: ${err}`)
  })
}

/**
 * Selects the correct handler from the commands array - if 2 commands have the same name,
 * the latter in the array will be chosen
 * @param msg the message that was sent
 */
function messageHandler(msg: djs.Message): void {
  // Check prefix
  if (!msg.content.startsWith(config.prefix)) {
    return;
  }
  console.log(`Handling message > ${msg.content}`);

  // Remove prefix and parameterise
  let withoutPrefix = msg.content.substring(config.prefix.length)
  // no params
  if (withoutPrefix.length == 0) {
    return;
  }
  let params: string[] = withoutPrefix.split(` `)

  // Find command
  let res: Command = undefined
  commands.forEach(c => res = c.names.includes(params[0]) ? c : res)

  // If no command found
  if (res === undefined) {
    console.log(`command ${params[0]} not found`)
    msg.reply(`**${params[0]}** is not a command!`)
      .catch(err => console.error(`unable to send response: ${err}`))
    return
  }

  // Handle command
  res.handler(params, msg)
}

class LeniencyHandler implements Command {
  names: string[] = [`leniency`, `external`]
  description: string = `Adds or removes a user or role from the external conditions`
  usage: string = `leniency <add / remove> <user id>`

  sendBadRequestMessage(msg: djs.Message) {
    msg.reply(`leniency takes 2 parameters, usage: ${this.usage}`)
      .catch(err => console.log(`unable to reply: ${err}`))
  }

  handler(params: string[], msg: djs.Message) {
    if (params.length !== 3 || getIfRoleOrUser(params[2]) !== `user`) {
      this.sendBadRequestMessage(msg)
      return
    }

    switch (params[1]) {
      case `add`:
        this.addLeniency(params[2], msg)
        break

      case `remove`:
        this.removeLeniency(params[2], msg)
        break

      default:
        this.sendBadRequestMessage(msg)
        break
    }

  }

  addLeniency(userId: string, msg: djs.Message) {
    var mem = msg.guild.member(userId)

    if (!mem) {
      msg.reply(`unable to get that user...`)
        .catch(err => {
          console.error(`unable to send leniency error message due to: ${err}`)
        })
      return
    }

    if (mem.roles.cache.has(config.leniencyRole)) {
      msg.reply(`that user has already been given leniency`)
        .catch(err => {
          console.error(`unable to send leniency error message due to: ${err}`)
        })
      return
    }

    mem.roles.add(config.leniencyRole, `${msg.author.username} added greeter leniency role`)
      .catch(err => {
        console.error(`adding leniency role failed due to: ${err}`)
        msg.reply(`unable to set leniency role due to: ${err}`)
          .catch(err => {
            console.error(`unable to send leniency error message due to: ${err}`)
          })
      })

    msg.reply(`leniency given!`)
      .catch(err => {
        console.error(`unable to send leniency success message due to: ${err}`)
      })
  }
  removeLeniency(userId: string, msg: djs.Message) {
    var mem = msg.guild.member(userId)

    if (!mem) {
      msg.reply(`unable to get that user...`)
        .catch(err => {
          console.error(`unable to send leniency error message due to: ${err}`)
        })
      return
    }

    if (!mem.roles.cache.has(config.leniencyRole)) {
      msg.reply(`that user has not been given leniency`)
        .catch(err => {
          console.error(`unable to send leniency error message due to: ${err}`)
        })
      return
    }

    mem.roles.remove(config.leniencyRole, `${msg.author.username} removed greeter leniency role`)
      .catch(err => {
        console.error(`removing leniency role failed due to: ${err}`)
        msg.reply(`unable to set leniency role due to: ${err}`)
          .catch(err => {
            console.error(`unable to send leniency error message due to: ${err}`)
          })
      })

    msg.reply(`leniency removed!`)
      .catch(err => {
        console.error(`unable to send leniency success message due to: ${err}`)
      })
  }
}

/**
 * Adds or removes exceptions
 */
class ExceptionUpdater implements Command {
  names: string[] = [`exception`, `exceptions`]
  description: string = `Adds or removes a user or role from the exceptions lists`
  usage: string = `exception <add / remove> <user id / role id>`

  handler(params: string[], msg: djs.Message) {
    if (params.length !== 3) {
      this.sendBadRequestMessage(msg)
      return
    }

    let addOrRemove: addRemoveUnion = getIfAddOrRemove(params[1])
    let roleOrUser: roleUserUnion = getIfRoleOrUser(params[2])
    if (roleOrUser === 'invalid' || addOrRemove === `invalid`) {
      this.sendBadRequestMessage(msg)
    } else if (roleOrUser === 'role') {
      if (addOrRemove === `add`) {
        this.addRoleException(params[2])
      } else {
        this.removeRoleException(params[2])
      }
    } else {
      if (addOrRemove === `add`) {
        this.addUserException(params[2])
      } else {
        this.removeUserException(params[2])
      }
    }

  }

  sendBadRequestMessage(msg: djs.Message) {
    msg.reply(`exception takes 2 parameters, usage: ${this.usage}`)
      .catch(err => console.log(`unable to reply: ${err}`))
  }

  addRoleException(roleId: string) {
    if (config.exceptionRoles.includes(roleId)) {
      return
    }
    config.exceptionRoles.push(roleId)
    writeConfigToFile()
  }

  removeRoleException(roleId: string) {
    let res: string[] = []
    config.exceptionRoles.forEach(id => { if (id !== roleId) { res.push(id) } })
    config.exceptionRoles = res
    writeConfigToFile()
  }

  addUserException(userId: string) {
    if (config.exceptionUsers.includes(userId)) {
      return
    }
    config.exceptionUsers.push(userId)
    writeConfigToFile()
  }

  removeUserException(userId: string) {
    let res: string[] = []
    config.exceptionUsers.forEach(id => { if (id !== userId) { res.push(id) } })
    config.exceptionUsers = res
    writeConfigToFile()
  }
}

class CmdData {
  value: string;
  constructor(names: string[], description: string, usage: string) {
    this.value = `**Name(s):** ${names.join(` | `)}
    **- Description:** ${description}
    **- Usage:** ${usage}`
  }
}

class HelpHandler implements Command {
  names: string[] = [`help`]
  description: string = `Gives help!`
  usage: string = `help`

  handler(params: string[], msg: djs.Message) {
    let msgText = `***GTrace Help Page***`

    let cmdData: CmdData[] = commands.map(c => new CmdData(c.names, c.description, c.usage))

    for (const c of cmdData) {
      msgText += `\n\n${c.value}`
    }

    msg.reply(msgText)
      .catch(err => console.log(`unable to send help text due to: ${err}`))
  }
}

function checkMemberHasAnyRole(member: djs.GuildMember, roles: string[]): Boolean {
  for (const r of member.roles.cache) {
    if (roles.includes[r[0]]) {
      return true
    }
  }
  return false
}

class CheckRunner implements Command {
  names: string[] = [`go`, `run`]
  description: string = `Runs the greeter check!!`
  usage: string = `go`

  async handler(params: string[], msg: djs.Message) {

    msg.reply(`processing...`)
    msg.channel.startTyping()

    let greeters = await msg.guild.roles.fetch(config.greeterRole)
      .then(r => r.members)

    // remove excepted users
    greeters = greeters.filter((member) => !config.exceptionUsers.includes(member.id)
      && !checkMemberHasAnyRole(member, config.exceptionRoles))

    let leniencies: { m: djs.GuildMember, l: Boolean }[] = greeters.map(g => {
      return { m: g, l: g.roles.cache.some(r => r.id === config.leniencyRole) }
    })

    let messages: djs.Message[] = []
    for (const id of config.greeterChannels) {
      let rawchan = await msg.client.channels.cache.get(id).fetch()
      if (rawchan.type !== 'text') {
        continue
      }
      let chan: djs.TextChannel = <djs.TextChannel>rawchan
      let msgs = await chan.messages.fetch({ around: /* TODO */ })
    }

    let withinLimit: Promise<{ m: djs.GuildMember, l: Boolean }>[] = leniencies.map(async g => {
      let res = false;
      let time = g.l ? 14 : 7


      return { m: g.m, l: res }
    })
  }
}

function main() {

  commands = [
    new CheckRunner,
    new ExceptionUpdater,
    new LeniencyHandler,
    new HelpHandler
  ]

  let client = new djs.Client({ ws: { intents: djs.Intents.ALL } });
  client.once('ready', () => {
    console.log(`GTrace Ready!`);
  })
  client.on('message', messageHandler)

  client.login(config.token)
}

main()
