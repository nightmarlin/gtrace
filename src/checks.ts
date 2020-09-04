import * as djs from "discord.js";
import { Command, getMembersWithRole, checkMemberHasRoleIn } from "./helpers";
import { Config } from "./configs";
import { runFollowUps, FollowUpInfo } from "./followups";

export async function runCheck(
  params: string[],
  msg: djs.Message,
  cmd: Command,
  config: Config
) {
  msg.reply(`processing...`);
  msg.channel.startTyping();

  await msg.guild.members.fetch();
  await msg.guild.roles.fetch();

  // Retrieve greeter channels
  console.log(`retrieving greeter channels...`);

  let greeterChannels: djs.TextChannel[] = [];
  for (const cId of config.greeterChannels) {
    // Cast to text channel and get missing properties
    let chan: djs.TextChannel = await (<djs.TextChannel>(
      msg.guild.channels.resolve(cId)
    ))
      .fetch()
      .catch((err) => {
        console.error(`unable to retrieve channel ${cId} due to: ${err}`);
        return undefined;
      })
      .then((c) => c);

    // If unable to resolve, skip
    if (chan !== undefined) {
      greeterChannels.push(chan);
    }
  }
  if (greeterChannels.length === 0) {
    msg
      .reply(`unable to complete operation: no greeter channels were found`)
      .catch((err) =>
        console.error(
          `unable to send greeter channel resolve error message due to: ${err}`
        )
      );
    return;
  }

  // Get greeters
  console.log(`retrieving greeters...`);
  let allGreeters = getMembersWithRole(config.greeterRole, msg.guild);

  // Subtract exceptions
  console.log(`removing exceptions`);
  let greetersToCheck: djs.GuildMember[] = [];
  let greetersOnBreak: djs.GuildMember[] = [];
  for (const g of allGreeters) {
    await g.fetch();
    if (
      !config.exceptionUsers.includes(g.id) && // User is not config excluded by id
      !checkMemberHasRoleIn(g, config.exceptionRoles) && // User is not config excluded by role
      !g.roles.cache.has(config.leniencyRole) // User is not on leniency
    ) {
      greetersToCheck.push(g);
    } else if (g.roles.cache.has(config.leniencyRole)) {
      greetersOnBreak.push(g);
    }
  }

  // Collect messages
  let msgs: djs.Message[] = [];
  for (const chan of greeterChannels) {
    console.log(
      `getting last ${config.limitInDays} days of messages in #${chan.name} [this may take some time]`
    );
    msgs = [...msgs, ...(await getDaysOfMessages(msg, chan, config))];
  }

  console.log(`filtering...`);
  let outOfLimit: djs.GuildMember[] = [];
  let edgeOfLimit: djs.GuildMember[] = [];
  for (const g of greetersToCheck) {
    if (!msgs.some((m) => m.author.id === g.id)) {
      outOfLimit.push(g);
    } else if (
      !msgs
        .filter((m) => m.author.id === g.id)
        .some(
          (m) =>
            m.createdAt >=
            new Date(
              Date.now() - (config.limitInDays - 1) * 24 * 60 * 60 * 1000
            )
        )
    ) {
      edgeOfLimit.push(g);
    }
  }

  console.log(`generating report`);
  let report = generateReport(outOfLimit, edgeOfLimit, greetersOnBreak, config);
  msg.channel.stopTyping();
  msg
    .reply(report.text)
    .catch((err) => console.log(`unable to send report due to: ${err}`));

  // Decide if follow up needed
  if (report.followup) {
    const filter = (m: djs.Message) => msg.author.id === m.author.id;
    msg.channel.awaitMessages(filter, { time: 30000, max: 1 }).then((ms) => {
      let m = ms.array()[0];
      if (m.content === `confirm`) {
        // Run followups
        console.log(`running follow-ups`);
        m.reply(`running follow-ups...`).catch((err) =>
          console.error(
            `unable to send follow up confirmation message due to: ${err}`
          )
        );

        let fui: FollowUpInfo = {
          refDate: new Date(
            Date.now() - config.limitInDays * 24 * 60 * 60 * 1000
          ),
          toAlert: edgeOfLimit,
          toRemove: outOfLimit,
          replyTo: msg,
        };
        runFollowUps(fui, config);
      } else {
        // Dont run follow ups
        console.log(`not running follow ups`);
        m.reply(`follow-ups will not be run`).catch((err) =>
          console.error(
            `unable to send follow up cancellation message due to: ${err}`
          )
        );
      }
    });
  }
}

function generateReport(
  outOfLimit: djs.GuildMember[],
  edgeOfLimit: djs.GuildMember[],
  onBreak: djs.GuildMember[],
  config: Config
): { text: string; followup: boolean } {
  let res = `**__greeter report - ${new Date()
    .toUTCString()
    .toLowerCase()}__**\n> *using limit of ${config.limitInDays} days*\n\n`;

  // Only add blocks when needed
  res += outOfLimit.length
    ? genReportBlock(`remove greeter from`, arrToString(outOfLimit))
    : ``;
  res += edgeOfLimit.length
    ? genReportBlock(`warn for next round`, arrToString(edgeOfLimit))
    : ``;
  res += onBreak.length
    ? genReportBlock(`currently on break`, arrToString(onBreak))
    : ``;

  res +=
    !outOfLimit.length && !edgeOfLimit.length && !onBreak.length
      ? `no greeters should be removed or warned. no greeters are on break\n`
      : ``;

  res +=
    outOfLimit.length || edgeOfLimit.length
      ? `if you'd like me to automatically follow up on this report, send \`confirm\` in the next 30 seconds, any other messages will cancel a follow-up`
      : ``;

  return {
    text: res,
    followup: outOfLimit.length !== 0 || edgeOfLimit.length !== 0,
  };
}

function arrToString(arr: djs.GuildMember[]): string {
  return arr
    .map(
      (m) =>
        ` - **${m.user.username}#${m.user.discriminator}** (\`${m.user.id}\`)`
    )
    .join(`\n`);
}

function genReportBlock(title: string, content: string): string {
  console.log(`generating '${title}' block`);
  // Define 3-backticks for shorthanding
  let cb = "```";

  // create a md code block for the title and then populate the content
  return `${cb}md\n# ${title}\n${cb}\n${content}\n\n`;
}

async function getMessagesBeforeOldest(
  oldestMsg: djs.Message,
  channel: djs.TextChannel
): Promise<djs.Message[]> {
  // console.log(`fetching messages older than ${oldestMsg.createdAt.toUTCString()}...`)
  let res = await channel.messages.fetch({ before: oldestMsg.id });
  return res.array();
}

async function getDaysOfMessages(
  msg: djs.Message,
  channel: djs.TextChannel,
  config: Config
): Promise<djs.Message[]> {
  let res: djs.Message[] = [];
  // Set limit
  let daysAgo: Date = new Date(
    Date.now() - config.limitInDays * 24 * 60 * 60 * 1000
  );

  while (!res.some((m) => m.createdAt < daysAgo)) {
    // Get messages before oldest msg
    let oldest: djs.Message = res.length === 0 ? msg : res[0];
    let incoming = await getMessagesBeforeOldest(oldest, channel);

    // Import incoming and sort [0]Oldest - [n]Newest
    res.push(...incoming);
    res = res.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    // console.log(`fetched ${incoming.length} messages, current oldest: ${res[0].createdAt.toUTCString()}`);
  }

  return res;
}
