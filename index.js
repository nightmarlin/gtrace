"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// DiscordJs API
const djs = __importStar(require("discord.js"));
// FileSystem API
const fs = __importStar(require("fs"));
/**
 * The path to the config file
 */
const configPath = "./config.json";
/**
 * Checks if the id given is a valid user or role ID
 * @param id The id to look up
 */
function getIfRoleOrUser(id) {
    return "invalid";
}
/**
 * Checks if the value given is one of "add" or "remove"
 * @param toCheck The string to check
 */
function getIfAddOrRemove(toCheck) {
    if (toCheck === `add` || toCheck === `remove`) {
        return toCheck;
    }
    return `invalid`;
}
/**
 *  The array of commands available, populated in main()
 */
let commands = undefined;
/**
 * The config object
 */
let config = require(configPath);
/**
 * Overwrites the current config file with the current stored config
 */
function writeConfigToFile() {
    let cfgAsJson = JSON.stringify(config);
    fs.writeFile(configPath, cfgAsJson, err => {
        console.log(`unable to save config: ${err}`);
    });
}
/**
 * Selects the correct handler from the commands array - if 2 commands have the same name,
 * the latter in the array will be chosen
 * @param msg the message that was sent
 */
function messageHandler(msg) {
    // Check prefix
    if (!msg.content.startsWith(config.prefix)) {
        return;
    }
    console.log(`Handling message > ${msg.content}`);
    // Remove prefix and parameterise
    let withoutPrefix = msg.content.substring(config.prefix.length);
    // no params
    if (withoutPrefix.length == 0) {
        return;
    }
    let params = withoutPrefix.split(` `);
    // Find command
    let res = undefined;
    commands.forEach(c => res = c.names.includes(params[0]) ? c : res);
    // If no command found
    if (res === undefined) {
        console.log(`command ${params[0]} not found`);
        msg.reply(`**${params[0]}** is not a command!`)
            .catch(err => console.error(`unable to send response: ${err}`));
        return;
    }
    // Handle command
    res.handler(params, msg);
}
class LeniencyHandler {
    constructor() {
        this.names = [`leniency`, `external`];
        this.description = `Adds or removes a user or role from the external conditions`;
        this.usage = `leniency <add / remove> <user id>`;
    }
    sendBadRequestMessage(msg) {
        msg.reply(`leniency takes 2 parameters, usage: ${this.usage}`)
            .catch(err => console.log(`unable to reply: ${err}`));
    }
    handler(params, msg) {
        if (params.length !== 3 || getIfRoleOrUser(params[2]) !== `user`) {
            this.sendBadRequestMessage(msg);
            return;
        }
        switch (params[1]) {
            case `add`:
                this.addLeniency(params[2], msg);
                break;
            case `remove`:
                this.removeLeniency(params[2], msg);
                break;
            default:
                this.sendBadRequestMessage(msg);
                break;
        }
    }
    addLeniency(userId, msg) {
        var mem = msg.guild.member(userId);
        if (!mem) {
            msg.reply(`unable to get that user...`)
                .catch(err => {
                console.error(`unable to send leniency error message due to: ${err}`);
            });
            return;
        }
        if (mem.roles.cache.has(config.leniencyRole)) {
            msg.reply(`that user has already been given leniency`)
                .catch(err => {
                console.error(`unable to send leniency error message due to: ${err}`);
            });
            return;
        }
        mem.roles.add(config.leniencyRole, `${msg.author.username} added greeter leniency role`)
            .catch(err => {
            console.error(`adding leniency role failed due to: ${err}`);
            msg.reply(`unable to set leniency role due to: ${err}`)
                .catch(err => {
                console.error(`unable to send leniency error message due to: ${err}`);
            });
        });
        msg.reply(`leniency given!`)
            .catch(err => {
            console.error(`unable to send leniency success message due to: ${err}`);
        });
    }
    removeLeniency(userId, msg) {
        var mem = msg.guild.member(userId);
        if (!mem) {
            msg.reply(`unable to get that user...`)
                .catch(err => {
                console.error(`unable to send leniency error message due to: ${err}`);
            });
            return;
        }
        if (!mem.roles.cache.has(config.leniencyRole)) {
            msg.reply(`that user has not been given leniency`)
                .catch(err => {
                console.error(`unable to send leniency error message due to: ${err}`);
            });
            return;
        }
        mem.roles.remove(config.leniencyRole, `${msg.author.username} removed greeter leniency role`)
            .catch(err => {
            console.error(`removing leniency role failed due to: ${err}`);
            msg.reply(`unable to set leniency role due to: ${err}`)
                .catch(err => {
                console.error(`unable to send leniency error message due to: ${err}`);
            });
        });
        msg.reply(`leniency removed!`)
            .catch(err => {
            console.error(`unable to send leniency success message due to: ${err}`);
        });
    }
}
/**
 * Adds or removes exceptions
 */
class ExceptionUpdater {
    constructor() {
        this.names = [`exception`, `exceptions`];
        this.description = `Adds or removes a user or role from the exceptions lists`;
        this.usage = `exception <add / remove> <user id / role id>`;
    }
    handler(params, msg) {
        if (params.length !== 3) {
            this.sendBadRequestMessage(msg);
            return;
        }
        let addOrRemove = getIfAddOrRemove(params[1]);
        let roleOrUser = getIfRoleOrUser(params[2]);
        if (roleOrUser === 'invalid' || addOrRemove === `invalid`) {
            this.sendBadRequestMessage(msg);
        }
        else if (roleOrUser === 'role') {
            if (addOrRemove === `add`) {
                this.addRoleException(params[2]);
            }
            else {
                this.removeRoleException(params[2]);
            }
        }
        else {
            if (addOrRemove === `add`) {
                this.addUserException(params[2]);
            }
            else {
                this.removeUserException(params[2]);
            }
        }
    }
    sendBadRequestMessage(msg) {
        msg.reply(`exception takes 2 parameters, usage: ${this.usage}`)
            .catch(err => console.log(`unable to reply: ${err}`));
    }
    addRoleException(roleId) {
        if (config.exceptionRoles.includes(roleId)) {
            return;
        }
        config.exceptionRoles.push(roleId);
        writeConfigToFile();
    }
    removeRoleException(roleId) {
        let res = [];
        config.exceptionRoles.forEach(id => { if (id !== roleId) {
            res.push(id);
        } });
        config.exceptionRoles = res;
        writeConfigToFile();
    }
    addUserException(userId) {
        if (config.exceptionUsers.includes(userId)) {
            return;
        }
        config.exceptionUsers.push(userId);
        writeConfigToFile();
    }
    removeUserException(userId) {
        let res = [];
        config.exceptionUsers.forEach(id => { if (id !== userId) {
            res.push(id);
        } });
        config.exceptionUsers = res;
        writeConfigToFile();
    }
}
class CmdData {
    constructor(names, description, usage) {
        this.value = `**Name(s):** ${names.join(` | `)}
    **- Description:** ${description}
    **- Usage:** ${usage}`;
    }
}
class HelpHandler {
    constructor() {
        this.names = [`help`];
        this.description = `Gives help!`;
        this.usage = `help`;
    }
    handler(params, msg) {
        let msgText = `***GTrace Help Page***`;
        let cmdData = commands.map(c => new CmdData(c.names, c.description, c.usage));
        for (const c of cmdData) {
            msgText += `\n\n${c.value}`;
        }
        msg.reply(msgText)
            .catch(err => console.log(`unable to send help text due to: ${err}`));
    }
}
function checkMemberHasAnyRole(member, roles) {
    for (const r of member.roles.cache) {
        if (roles.includes[r[0]]) {
            return true;
        }
    }
    return false;
}
class CheckRunner {
    constructor() {
        this.names = [`go`, `run`];
        this.description = `Runs the greeter check!!`;
        this.usage = `go`;
    }
    handler(params, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            msg.reply(`processing...`);
            msg.channel.startTyping();
            let greeters = yield msg.guild.roles.fetch(config.greeterRole)
                .then(r => r.members);
            // remove excepted users
            greeters = greeters.filter((member) => !config.exceptionUsers.includes(member.id)
                && !checkMemberHasAnyRole(member, config.exceptionRoles));
            let leniencies = greeters.map(g => {
                return { m: g, l: g.roles.cache.some(r => r.id === config.leniencyRole) };
            });
            let messages = [];
            for (const id of config.greeterChannels) {
                let rawchan = yield msg.client.channels.cache.get(id).fetch();
                if (rawchan.type !== 'text') {
                    continue;
                }
                let chan = rawchan;
                let msgs = yield chan.messages.fetch({ around:  /* TODO */ });
            }
            let withinLimit = leniencies.map((g) => __awaiter(this, void 0, void 0, function* () {
                let res = false;
                let time = g.l ? 14 : 7;
                return { m: g.m, l: res };
            }));
        });
    }
}
function main() {
    commands = [
        new CheckRunner,
        new ExceptionUpdater,
        new LeniencyHandler,
        new HelpHandler
    ];
    let client = new djs.Client({ ws: { intents: djs.Intents.ALL } });
    client.once('ready', () => {
        console.log(`GTrace Ready!`);
    });
    client.on('message', messageHandler);
    client.login(config.token);
}
main();
//# sourceMappingURL=index.js.map