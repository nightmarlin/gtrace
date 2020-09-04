import * as djs from "discord.js";
import {
  getIfRoleOrUser,
  Command,
  sendBadRequestMessage,
  addRole,
  removeRole,
  getMembersWithRole,
} from "./helpers";
import { Config } from "./configs";

export async function onBreakHandler(
  params: string[],
  msg: djs.Message,
  cmd: Command,
  config: Config
) {
  // Check if get request
  if (params.length >= 2 && params[1] === "get") {
    let msgTxt = "";

    if (
      params.length === 3 &&
      getIfRoleOrUser(params[2], msg.guild) === `user`
    ) {
      // If user specified, get user break status
      let u = msg.guild.members.resolve(params[2]);
      msgTxt = `**${u.user.username}#${u.user.discriminator}** is ${
        u.roles.cache.has(config.leniencyRole) ? "" : "not"
      } currently on break`;
    } else {
      // Else get status of all users on break
      let leniencies = findUsersOnBreak(msg, config)
        .map((l) => {
          return ` - **${l.user.username}#${l.user.discriminator}** (\`${l.id}\`)`;
        })
        .join(`\n`);
      msgTxt = `the following users are currently on break:\n\n${leniencies}`;
    }

    msg
      .reply(msgTxt)
      .catch((err) =>
        console.log(`unable to send break status message due to: ${err}`)
      );
    return;
  } else if (
    params.length !== 3 ||
    getIfRoleOrUser(params[2], msg.guild) !== `user`
  ) {
    // Invalid params
    sendBadRequestMessage(msg, cmd, 2);
    return;
  } else if (!config.shouldTryToEditRoles) {
    // Can't edit roles, so don't bother trying
    msg
      .reply(
        `adding and removing breaks has been disabled - ` +
          `try setting <@&${config.leniencyRole}> with another bot or doing it manually`,
        { allowedMentions: { parse: ["users"] } }
      )
      .catch((err) =>
        console.error(
          `unable to send break management disabled message due to: ${err}`
        )
      );
    return;
  }

  let id = params[2];
  let success: Boolean = false;

  // add or remove
  switch (params[1]) {
    case `add`:
      success = await addUserOnBreak(id, msg, config);
      if (success) {
        sendSuccess(msg, id);
      } else {
        sendFailure(msg, id);
      }
      break;

    case `remove`:
      success = await removeUserFromBreak(id, msg, config);
      if (success) {
        sendSuccess(msg, id);
      } else {
        sendFailure(msg, id);
      }
      break;

    default:
      sendBadRequestMessage(msg, cmd, 2);
      break;
  }
}

function findUsersOnBreak(msg: djs.Message, config: Config): djs.GuildMember[] {
  return getMembersWithRole(config.leniencyRole, msg.guild);
}

function sendSuccess(msg: djs.Message, id: string) {
  msg
    .reply(`break status updated for <@${id}> (\`${id}\`)!`)
    .catch((err) =>
      console.error(
        `unable to send break status change success message due to: ${err}`
      )
    );
}

function sendFailure(msg: djs.Message, id: string) {
  msg
    .reply(`unable to update break status for <@${id}> (\`${id}\`) :pensive:`)
    .catch((err) =>
      console.error(
        `unable to send break status change error message due to: ${err}`
      )
    );
}

async function addUserOnBreak(
  userId: string,
  msg: djs.Message,
  config: Config
): Promise<Boolean> {
  return addRole(userId, config.leniencyRole, msg.guild);
}

async function removeUserFromBreak(
  userId: string,
  msg: djs.Message,
  config: Config
): Promise<Boolean> {
  return removeRole(userId, config.leniencyRole, msg.guild);
}
