const fs = require("fs");
const path = require("path");
const discord = require('discord.js');
const client = new discord.Client();
const Command = require('./model/Command.js');
const Server = require('./model/Server.js');

var config = { api_token: '123abc', soundcloud_token: 'aabbcc' };
try {
    config = require('./data/conf.json');
} catch (e) {
    console.warn("Make sure to configure the bot: using default settings.");
    let data_folder = path.join(__dirname, "data");
    if (!fs.existsSync(data_folder)) fs.mkdirSync(data_folder);
    fs.writeFileSync(path.join(data_folder, "conf.json"), JSON.stringify(config));
}

const SoundCloud = new (require('./external/soundcloud-api.js'))(config.soundcloud_token);
var Servers = {};

const prefix = '!';
const bot_commands = {
    'help': new Command('Display helpful info', async (message, args, channel) => {
        let embed = new discord.RichEmbed();
        embed.setTitle('Bot commands');
        for (key in bot_commands) {
            embed.addField(`${prefix}${key}`, `${bot_commands[key].desc}`);
        }
        channel.send(embed);
    }),
    'say': new Command('Repeat what you said', async (message, args, channel) => {
        message.delete();
        channel.send(args.join(' '));
    }),
    'sc': new Command('Play or search for a SoundCloud song', async (message, args, channel) => {
        if (args[0] && args[0] !== 'search') {
            SoundCloud.getTrack(args[0]).then(data => {

            });
        } else if (args[0] === 'search') {
            SoundCloud.searchTrack(args[1]).then(data => {

            });
        }
    }),
    'vc': new Command('Useful voice chat commands', async (message, args, channel) => {
        let server = Servers[message.guild.id];
        if (args[0]) {
            if (args[0] === 'join') {
                if (message.member.voice.channel && !(server.voiceChannel || server.voiceConnection)) {
                    server.voiceChannel = message.member.voice.channel;
                    server.voiceConnection = await message.member.voice.channel.join();
                    channel.send('Connected to the voice channel');
                } else if (!message.member.voice.channel) {
                    channel.send("You must be connected to a voice channel!");
                } else {
                    channel.send("I am already connected to a voice channel!");
                }
            } else if (args[0] === 'leave') {
                if (server.voiceChannel || server.voiceConnection) {
                    server.voiceChannel.leave();
                } else {
                    channel.send("I am not connected to a voice channel!");
                }
            }
        }
    })
}

client.on('ready', () => {
    client.guilds.forEach(guild => {
        Servers[guild.id] = new Server(guild.name);
    });
});

client.on("guildCreate", guild => {
    Servers[guild.id] = new Server(guild.name);
})

client.on("guildDelete", guild => {
    delete Servers[guild.id];
})

client.on('message', message => {
    if (message.author.id !== client.user.id && !message.author.bot && message.content.startsWith(prefix)) {
        let args = message.content.substring(prefix.length).trim().split(' ');
        let command = args.shift();
        if (bot_commands.hasOwnProperty(command)) {
            bot_commands[command].executor(message, args, message.channel);
        }
    }
});

client.on('guildMemberSpeaking', (member, speaking) => {
    let server = Servers[member.guild.id];
    if (speaking && server.voiceConnection) {
        var stream = server.voiceConnection.receiver.createStream(member.user, { mode: 'pcm', end: 'silence' });
        var outputStream = fs.createWriteStream(path.join(__dirname, 'audio.wav'));
        stream.pipe(outputStream);
        stream.on('end', () => console.log('ended'));
    }
});

client.login(config.api_token).then(() => console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`));