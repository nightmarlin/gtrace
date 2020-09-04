import * as djs from "discord.js";
import { Command } from "./helpers";
import { Config } from "./configs";

// Stores the stringified data of a comand
class CmdData {
  value: string;
  constructor(names: string[], description: string, usage: string) {
    this.value = `**name(s):** ${names.join(` | `)}
    **- description:** ${description}
    **- usage:** ${usage}`;
  }
}

// attaches help command to commands array
export function initGetHelp(commands: Command[]) {
  let toAdd = new Command([`help`], `gets help`, `help`, function (
    params: string[],
    msg: djs.Message,
    cmd: Command,
    config: Config
  ) {
    // Header and config deets
    let msgText = `***gtrace help page***\n> see the source at \`https://github.com/Nightmarlin/gtrace\`
**limit:** ${config.limitInDays} days | **control role:** <@&${config.controlRole}>
**greeter role:** <@&${config.greeterRole}> | **leniency role:** <@&${config.leniencyRole}>
**should manage breaks:** ${config.shouldTryToEditRoles} | **exceptions:** ${config.exceptionUsers.length} user(s), ${config.exceptionRoles.length} role(s)\n`;

    // append cmd data to array
    let cmdData: string[] = commands.map(
      (c) => new CmdData(c.names, c.description, c.usage).value
    );
    for (const c of cmdData) {
      msgText += `\n\n${c}`;
    }

    // Send help msg
    msg
      .reply(msgText, { allowedMentions: { parse: ["users"] } })
      .catch((err) => console.log(`unable to send help text due to: ${err}`));
  });

  commands.push(toAdd);
}
