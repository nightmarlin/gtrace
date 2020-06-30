// DiscordJs API
import * as djs from 'discord.js'

// My own imports
import { runCheck } from './src/checks'
import { Config } from './src/configs'
import { exceptionHandler } from './src/exceptions'
import { initGetHelp } from './src/getHelp'
import { Command } from './src/helpers'
import { leniencyHandler } from './src/leniencies'

const config = Config.getInstance()

let commands: Command[] = [
  new Command(
    [`go`, `run`],
    `runs the greeter check`,
    `go`,
    runCheck
  ),
  new Command(
    [`exception`, `exceptions`],
    `Adds or removes a user or role from the exceptions lists`,
    `exception <add / remove> <user id / role id>`,
    exceptionHandler
  ),
  new Command(
    [`leniency`, `external`],
    `Adds or removes a user or role from the external conditions`,
    `leniency <add / remove> <user id>`,
    leniencyHandler
  ),
  new Command(
    [`ping`],
    `Responds with 'pong'`,
    `ping`,
    function (params, msg, cmd, config) {
      msg.reply(`> Pong!!`)
        .catch(err => console.error(`unable to send pong due to: ${err}`))
    }
  )
]

/**
 * Selects the correct handler from the commands array - if 2 commands have the same name,
 * the latter in the array will be chosen
 * @param msg the message that was sent
 */
function messageHandler(msg: djs.Message): void {

  initGetHelp(commands)

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
  res.handler(params, msg, res, config)
}

function main() {

  let client = new djs.Client({ ws: { intents: djs.Intents.ALL } });
  client.once('ready', () => {
    console.log(`GTrace Ready!`);
  })
  client.on('message', messageHandler)

  client.login(config.token)
}

main()