// DiscordJs API
import * as djs from 'discord.js'

// My own imports
import { runCheck } from './src/checks'
import { Config } from './src/configs'
import { exceptionHandler } from './src/exceptions'
import { initGetHelp } from './src/getHelp'
import { Command } from './src/helpers'
import { leniencyHandler } from './src/leniencies'
import { getReports } from './src/reports'

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
    `Adds or removes a user or role from the external conditions leniency`,
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
  ),
  new Command(
    [`report`, `getinfo`],
    `Gets the currently cached reports`,
    `report`,
    getReports
  )
]

/**
 * Selects the correct handler from the commands array - if 2 commands have the same name,
 * the latter in the array will be chosen
 * @param msg the message that was sent
 */
function messageHandler(msg: djs.Message): void {
  const config = Config.getInstance()
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
  const config = Config.getInstance()

  // Connectify
  let client = new djs.Client({ ws: { intents: djs.Intents.ALL } });
  client.once('ready', () => {
    console.log(`GTrace Ready!`)
    console.log(`Invite me using 'https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=268635136'`)

    let pd: djs.PresenceData = {
      activity: {
        name: 'at doing marlin\'s job for him',
        type: 'PLAYING'
      },
      status: 'online'
    }
    client.user.setPresence(pd)
  })

  client.on('message', messageHandler)

  client.login(config.token)

}

main()
