const fs = require("fs");
const path = require("path");
const discord = require('discord.js');
const client = new discord.Client();
const Command = require('./model/Command.js');
const Server = require('./model/Server.js');
const Room = require('./model/Room.js');
const SilenceFrame = require('./utils/SilenceFrame.js');
const BufferUtils = require('./utils/BufferUtils.js');

const SoundCloud = new (require('./external/soundcloud-api.js'))(process.env.SOUNDCLOUD_TOKEN);
var Servers = {};
var Rooms = [new Room('not that much', 5), new Room('tests', 10), new Room('kit kat', 20), new Room('king', 30)];

const prefix = '!';
const bot_commands = {
    'help': new Command('Display helpful info', async (message, args, channel) => {
        let embed = new discord.MessageEmbed();
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
            switch (args.shift()) {
                case 'join':
                    if (!args[0]) {
                        if (message.member.voice.channel && !server.voiceConnection) {
                            server.voiceChannel = message.member.voice.channel;
                            server.voiceConnection = await message.member.voice.channel.join();
                            channel.send('Connected to the voice channel');
                        } else if (!message.member.voice.channel) {
                            channel.send("You must be connected to a voice channel!");
                        } else {
                            channel.send("I am already connected to a voice channel!");
                        }
                    } else if (args.shift() === 'room') {
                        if (server.isConnectedToRoom()) {
                            channel.send(`This server is already connected to room \`${server.room}\``);
                        } else {
                            let room = Rooms.find(e => (args[0] ? e.name === args.join(' ') : !e.isFull()) && !e.containsGuild(message.guild.id));
                            if (room) {
                                if (room.addGuild(message.guild.id)) {
                                    server.setConnectedRoom(room);
                                    channel.send(`Joined room \`${room.name}\`!`);
                                } else {
                                    channel.send('This room is full!');
                                }
                            } else {
                                channel.send(`I couldn't find a room named \`${args.join(' ')}\``);
                            }
                        }
                    }
                    break;
                case 'leave':
                    if (!args[0]) {
                        if (server.voiceConnection) {
                            server.voiceChannel.leave();
                            delete server.voiceConnection;
                            if (server.isConnectedToRoom()) {
                                let room = Rooms.find(e => e.name === server.room);
                                room.removeServer(server, message.guild.id);
                                channel.send(`Left room \`${room.name}\``);
                            }
                        } else {
                            channel.send("I am not connected to a voice channel!");
                        }
                    } else if (args.shift() === 'room') {
                        if (server.isConnectedToRoom()) {
                            Rooms.find(e => e.name === server.room).removeServer(server, message.guild.id);
                            channel.send("Successfully left the room!");
                        } else {
                            channel.send("This server is not connected to a room!");
                        }
                    }
                    break;
                case 'rooms':
                    let embed = new discord.MessageEmbed();
                    embed.setTitle('Available rooms:');
                    Rooms.forEach(room => embed.addField(`${room.name === server.room ? '> ' : ''}${room.name}${room.name === server.room ? ' <' : ''}`, `${room.getConnectedGuilds()}/${room.max_connections} servers connected`, true));
                    channel.send(embed);
                    break;
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
    if (speaking.bitfield && member.user.id !== client.user.id && !member.user.bot && server.isConnectedToRoom() && server.voiceConnection) {
        let room = Rooms.find(e => e.name === server.room);
        var stream = server.voiceConnection.receiver.createStream(member.user, { mode: 'opus', end: 'silence' });
        server.dispatcher = server.voiceConnection.play(new SilenceFrame(), { type: 'opus' });
        stream.on('data', chunk => {
            BufferUtils.createReadableStream(chunk).then(buffer => {
                room.connections.filter(id => id !== member.guild.id && Servers[id].voiceConnection).forEach(async guild => {
                    Servers[guild].voiceConnection.play(buffer, { type: 'opus', seek: 0, volume: false });
                });
            });
        });
        stream.on('end', () => server.dispatcher.end());
    }
});

client.login(process.env.API_TOKEN).then(() => console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`));