import * as fs from 'fs'

export type UserOrRole = 'user' | 'role'

// Config typings
export class Config {

  private static instance: Config = null
  static configPath: string = "../config.json"

  private constructor() { }

  private static load() {
    Config.instance = new Config()
    let c: ConfigSaveable = require(Config.configPath)
    Config.instance.token = c.token
    Config.instance.prefix = c.prefix
    Config.instance.greeterRole = c.greeterRole
    Config.instance.leniencyRole = c.leniencyRole
    Config.instance.greeterChannels = c.greeterChannels
    Config.instance.exceptionRoles = c.exceptionRoles
    Config.instance.exceptionUsers = c.exceptionUsers
    Config.instance.controlRole = c.controlRole

  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.load()
    }
    // console.log(Config.instance)
    return Config.instance
  }

  /**
   * The bot user token
   */
  token: string
  /**
   * The configured bot prefix
   */
  prefix: string
  /**
   * The bot management role
   */
  controlRole: string
  /**
   * The greeter role id
   */
  greeterRole: string
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
  /**
   * Removes an exception and saves saves the config to the file
   * @param id The id to remove
   * @param which Whether the id is that of a user or role
   */
  removeException(id: string, which: UserOrRole) {
    if (which === "user" && this.exceptionUsers.includes(id)) {
      this.exceptionUsers.filter(uid => uid !== id)
    } else if (this.exceptionRoles.includes(id)) {
      this.exceptionRoles.filter(rid => rid !== id)
    }
  }

  /**
   * Adds an exception and saves the config to the file
   * @param id The id to add
   * @param which Whether the id is that of a user or role
   */
  addException(id: string, which: UserOrRole) {
    if (which === "user" && !this.exceptionUsers.includes(id)) {
      this.exceptionUsers.push(id)
    } else if (!this.exceptionRoles.includes(id)) {
      this.exceptionRoles.push(id)
    }
  }

}

/**
 * Describes the shepe of the config file
 */
interface ConfigSaveable {
  token: string
  prefix: string
  controlRole: string
  greeterRole: string
  leniencyRole: string
  greeterChannels: string[]
  exceptionRoles: string[]
  exceptionUsers: string[]
}