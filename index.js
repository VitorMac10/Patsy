const fs = require("fs");
const path = require("path");
const discord = require('discord.js');
const client = new discord.Client();
const Command = require('./commandBase.js');

var config = { api_token: '123abc' };
try {
    config = require('./data/conf.json');
} catch (e) {
    console.warn("Make sure to configure the bot: using default settings.");
    let data_folder = path.join(__dirname, "data");
    if (!fs.existsSync(data_folder)) fs.mkdirSync(data_folder);
    fs.writeFileSync(path.join(data_folder, "conf.json"), JSON.stringify(config));
}

const prefix = '!';
const bot_commands = {
    'help': new Command('Display helpful info', async function (message, args, channel) {
        let embed = new discord.RichEmbed();
        embed.setTitle('Bot commands');
        for (key in bot_commands) {
            embed.addField(`${prefix}${key}`, `${bot_commands[key].desc}`);
        }
        channel.send(embed);
    }),
    'say': new Command('Repeat what you said', async function (message, args, channel) {
        message.delete();
        channel.send(args.join(' '));
    })
}

client.on('message', message => {
    if (message.content.startsWith(prefix)) {
        let args = message.content.substring(prefix.length).trim().split(' ');
        let command = args.shift();
        if (bot_commands.hasOwnProperty(command)) {
            bot_commands[command].executor(message, args, message.channel);
        }
    }
});

client.login(config.api_token).then(() => console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`));