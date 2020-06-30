import * as fs from 'fs'

export type UserOrRole = 'user' | 'role'

// Config typings
export class Config {

  private static instance: Config
  static configPath: string = "./config"

  private constructor() { }

  private static load() {
    Config.instance = new Config()
    let c = require(Config.configPath)
    Config.instance.token = c.token
    Config.instance.prefix = c.prefix
    Config.instance.greeterRole = c.greeterRole
    Config.instance.warningRole = c.warningRole
    Config.instance.leniencyRole = c.leniencyRole
    Config.instance.greeterChannels = c.greeterChannels
    Config.instance.exceptionRoles = c.exceptionRoles
    Config.instance.exceptionUsers = c.exceptionUsers

  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.load()
    }
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

  /**
   * Overwrites the current config file with the current stored config
   */
  writeConfigToFile() {
    let cfgAsJson = JSON.stringify(this)

    fs.writeFile(Config.configPath, cfgAsJson, err => {
      console.log(`unable to save config: ${err}`)
    })
  }

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
    this.writeConfigToFile()
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
    this.writeConfigToFile()
  }
}