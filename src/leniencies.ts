import * as djs from 'discord.js'
import { getIfRoleOrUser, Command, sendBadRequestMessage } from './helpers'
import { Config } from './configs'

export async function leniencyHandler(params: string[], msg: djs.Message, cmd: Command, config: Config) {
  if (params.length !== 3 || getIfRoleOrUser(params[2], msg.guild) !== `user`) {
    sendBadRequestMessage(msg, cmd, 2)
    return
  }

  switch (params[1]) {
    case `add`:
      addLeniency(params[2], msg, config)
      break

    case `remove`:
      removeLeniency(params[2], msg, config)
      break

    default:
      sendBadRequestMessage(msg, cmd, 2)
      break
  }

}

function addLeniency(userId: string, msg: djs.Message, config: Config) {
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

function removeLeniency(userId: string, msg: djs.Message, config: Config) {
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