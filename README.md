# GTrace

## Overview

Keep an eye on those pesky Greeters and make sure they're up to scratch

Set up a local version by setting `config.json` and then run `yarn run go` - It's that easy!!

> If you don't have yarn, I recommend installing it - but NPM works fine too (`npm run go`)

`https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=268504064`

> This link will appear in the console upon being run, with the id set

## Config

| field                | type     | description                                             |
| -------------------- | -------- | ------------------------------------------------------- |
| token                | string   | Bot token                                               |
| prefix               | string   | Bot prefix                                              |
| controlRole          | string   | ID of role allowed to use bot                           |
| greeterRole          | string   | ID of role that identifies greeters                     |
| onBreakRole          | string   | ID of role the identifies greeters on break             |
| greeterChannels      | string[] | Array of IDs of channels to measure greeter activity in |
| exceptionRoles       | string[] | Array of roles to ignore in checks                      |
| exceptionUsers       | string[] | Array of users to ignore in checks                      |
| limitInDays          | number   | The number of days to limit by - recommended: 7         |
| shouldTryToEditRoles | boolean  | Whether the bot should try to edit roles itself or not  |

## Permissions

> [I recommend using permissions value 268504064](https://discordapi.com/permissions.html#268504064)

| Permission           | Justification                         |
| -------------------- | ------------------------------------- |
| Manage Roles         | Add/Remove leniency and greeter roles |
| Read Messages        | Get messages in measured channels     |
| Read Message History | Get messages in measured channels     |
| Send Messages        | Respond to commands                   |
| View Voice Channel   | Available as part of another perm     |
