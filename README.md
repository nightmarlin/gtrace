<!-- markdownlint-disable MD033 -->
# gtrace

## overview

keep an eye on those pesky greeters and make sure they're up to scratch.
set up a local version by

1. cloning this repo
2. creating a discord application and bot user at the [discord developer website](https://discord.com/developers/applications)
3. setting `config.json`
4. running `yarn && yarn run go`

it's that easy!!

> if you don't have [yarn](https://yarnpkg.com/), i recommend installing it -
> but npm works fine too (`npm i && npm run go`)

`https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=268504064`

> this link will appear in the console upon being run, with the id set

## config

| field                | type     | description                                             |
| -------------------- | -------- | ------------------------------------------------------- |
| token                | string   | bot token                                               |
| prefix               | string   | bot prefix                                              |
| controlRole          | string   | id of role allowed to use bot                           |
| greeterRole          | string   | id of role that identifies greeters                     |
| onBreakRole          | string   | id of role the identifies greeters on break             |
| greeterChannels      | string[] | array of IDs of channels to measure greeter activity in |
| exceptionRoles       | string[] | array of roles to ignore in checks                      |
| exceptionUsers       | string[] | array of users to ignore in checks                      |
| limitInDays          | number   | the number of days to limit by - recommended: 7         |
| shouldTryToEditRoles | boolean  | whether the bot should try to edit roles itself or not  |

## permissions

> [i recommend using permissions value 268504064](https://discordapi.com/permissions.html#268504064),
> however the bot can operate without `manage roles`[<sup>\[1\]</sup>](#notes)

| permission           | justification                           |
| -------------------- | --------------------------------------- |
| manage roles         | add/remove leniency and greeter roles   |
| read messages        | get messages in measured channels       |
| read message history | get messages in measured channels       |
| send messages        | respond to commands                     |
| view voice channel   | available as part of another permission |

## commands

> `<param>` denotes a required parameter, `[param]` denotes an optional parameter

### go

**aliases:** `run`

**usage:** `gt!go`

**description:** runs the check (this may take some time). if the check returns with
recommended actions to be taken, you will be prompted to choose whether the bot should
"follow up" on those actions itself:

- for greeters in the `remove greeter from` block (if present)
  - send an alert dm
  - remove the greeter role[<sup>\[2\]</sup>](#notes)
- for greeters in the `alert for next round`[<sup>\[3\]</sup>](#notes) block (if present)
  - send an alert dm

sending anything other than `confirm` after the prompt will cancel all follow-ups

### break

**aliases:** `leniency` | `external`

**usage:** `gt!break get [user id]` | `gt break <add / remove> <user id>`

**description \(get\):** gets the on-break status of greeters. if `user id` is specified,
the command will return the on-break status of that user only

**description \(add / remove\):**[<sup>\[2\]</sup>](#notes) adds or removes the on-break role
defined in the config file to/from the user. these commands are disabled if
`shouldTryToEditRoles` is set to `false`

### ping

**usage:** `gt!ping`

**description:** activity checker - responds with "pong"

### help

**usage:** `gt!help`

**description:** gets help! sends a large help message - you probably shouldn't use this
in popular channels...

## notes

**<sup>\[1\]</sup>:** if `manage roles` is denied, you should set `shouldTryToEditRoles` to
`false` in the `config.json`

**<sup>\[2\]</sup>:** The bot will only attempt to set roles if `shouldTryToEditRoles` is set
to `true` in the `config.json`

**<sup>\[3\]</sup>:** these are greeters whose last recorded activity is at most one day from
the defined limit

if a user without the control role pings the bot, it will respond with a "you can't use this bot"
message. if a user with the control role pings the bot it will respond with the prefix

dm-ing the bot will return a message telling the user that it can only be used in their mutual
server
