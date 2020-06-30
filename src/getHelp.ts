import * as djs from 'discord.js'
import { Command } from './helpers';
import { Config } from './configs';

class CmdData {
  value: string;
  constructor(names: string[], description: string, usage: string) {
    this.value = `**Name(s):** ${names.join(` | `)}
    **- Description:** ${description}
    **- Usage:** ${usage}`
  }
}

export function initGetHelp(commands: Command[]) {

  let toAdd = new Command(
    [`help`],
    `gets help`,
    `help`,

    function getHelp(params: string[], msg: djs.Message, cmd: Command, config: Config) {
      let msgText = `***GTrace Help Page***`

      let cmdData: CmdData[] = commands.map(c => new CmdData(c.names, c.description, c.usage))

      for (const c of cmdData) {
        msgText += `\n\n${c.value}`
      }

      msg.reply(msgText)
        .catch(err => console.log(`unable to send help text due to: ${err}`))
    }
  )
  commands.push(toAdd)
}