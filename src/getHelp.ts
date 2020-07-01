import * as djs from 'discord.js'
import { Command } from './helpers';
import { Config } from './configs';

// Stores the stringified data of a comand
class CmdData {
  value: string;
  constructor(names: string[], description: string, usage: string) {
    this.value = `**Name(s):** ${names.join(` | `)}
    **- Description:** ${description}
    **- Usage:** ${usage}`
  }
}

// attaches help command to commands array
export function initGetHelp(commands: Command[]) {
  let toAdd = new Command(
    [`help`],
    `gets help`,
    `help`,
    function (params: string[], msg: djs.Message, cmd: Command, config: Config) {
      // Header and config deets
      let msgText = `***GTrace Help Page***\n> See the source at \`https://github.com/Nightmarlin/gtrace\`
**Limit:** ${config.limitInDays} days | **Control Role:** <@&${config.controlRole}>
**Greeter Role:** <@&${config.greeterRole}> | **On-Break Role:** <@&${config.onBreakRole}>
**Should Manage Breaks:** ${config.shouldTryToEditRoles} | **Exceptions:** ${config.exceptionUsers.length} user(s), ${config.exceptionRoles.length} role(s)\n`

      // append cmd data to array
      let cmdData: string[] = commands.map(c => new CmdData(c.names, c.description, c.usage).value)
      for (const c of cmdData) {
        msgText += `\n\n${c}`
      }

      // Send help msg
      msg.reply(msgText, { allowedMentions: { parse: ['users'] } })
        .catch(err => console.log(`unable to send help text due to: ${err}`))
    }
  )

  commands.push(toAdd)
}