import * as djs from 'discord.js'

import { Config } from './configs'

/**
 * Defines the method signature of a command handler
 */
export type CommandHandler = (params: string[], msg: djs.Message, cmd: Command, config: Config) => void

export class Command {
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

  /**
   * CTOR
   * @param names Names to use the command
   * @param description Command description
   * @param usage How to use the command
   * @param handler The function to call to handle the command
   */
  constructor(names: string[], description: string, usage: string, handler: CommandHandler) {
    this.names = names
    this.description = description
    this.usage = usage
    this.handler = handler
  }
}

export function checkMemberHasRoleIn(member: djs.GuildMember, roles: string[]): Boolean {
  for (const r of member.roles.cache) {
    if (roles.includes(r[0])) {
      return true
    }
  }
  return false
}

export function getMembersWithRole(id: string, guild: djs.Guild): djs.GuildMember[] {
  let res: djs.GuildMember[] = []
  for (const m of guild.roles.resolve(id).members) {
    if (m) {
      res.push(m[1])
    }
  }
  return res
}

/**
 * Defines the role/user/inavlid result type
 */
export type RoleUserUnion = `role` | `user`
/**
 * Checks if the id given is a valid user or role ID - retunrs undefined if neither
 * @param id The id to look up
 */
export function getIfRoleOrUser(id: string, guild: djs.Guild): RoleUserUnion {
  if (guild.roles.resolve(id)) {
    return 'role'
  } else if (guild.members.resolve(id)) {
    return 'user'
  }
  return undefined
}

/**
 * Defines the role/user/inavlid result type
 */
export type AddRemoveUnion = `add` | `remove`

/**
 * Checks if the value given is one of "add" or "remove"
 * @param toCheck The string to check
 */
export function getIfAddOrRemove(toCheck: string): AddRemoveUnion {
  if (toCheck === `add` || toCheck === `remove`) {
    return toCheck
  }
  return undefined
}

/**
 * Sends an error message with information on how to use the cmd
 * @param msg The message to reply to
 * @param cmd The calling command
 * @param n The number of parameters this command accepts
 */
export function sendBadRequestMessage(msg: djs.Message, cmd: Command, n: Number) {
  msg.reply(`${cmd.names[0]} takes ${n} parameters, usage: ${cmd.usage}`)
    .catch(err => console.log(`unable to send bad request message for ${cmd.names[0]} due to: ${err}`))
}

/**
 * Adds the role to the user if user does not already have the role
 * @param uId User id to add role to
 * @param rId Role id to add to user
 * @param guild Guild to perform operation in
 */
export async function addRole(uId: string, rId: string, guild: djs.Guild): Promise<Boolean> {
  let r = guild.roles.resolve(rId)
  let m = guild.members.resolve(uId)
  if (r && m && !m.roles.cache.has(rId)) {
    let res = m.roles.add(r, 'Role granted for Greeter Tracing')
      .then(_ => true)
      .catch(err => {
        console.log(`unable to add role ${r.name} to user ${m.user.username} due to ${err}`)
        return false
      })
    return res
  }
  return false
}

/**
 * Removes the role from the user if user already has the role
 * @param uId User id to remove role from
 * @param rId Role id to remove from user
 * @param guild Guild to perform operation in
 */
export async function removeRole(uId: string, rId: string, guild: djs.Guild): Promise<Boolean> {
  let r = guild.roles.resolve(rId)
  let m = guild.members.resolve(uId)
  if (r && m && m.roles.cache.has(rId)) {
    let res = m.roles.remove(r, 'Role removed for Greeter Tracing')
      .then(_ => true)
      .catch(err => {
        console.log(`unable to remove role ${r.name} from user ${m.user.username} due to ${err}`)
        return false
      })
    return res
  }
  return false;
}