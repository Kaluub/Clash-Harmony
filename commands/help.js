const {MessageEmbed} = require('discord.js');
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});
const {readJSON} = require('../json.js');

function baseEmbed(message,args,admins){
    return new MessageEmbed()
        .setTitle(`Help Interface:`)
        .setDescription(`Here is a list of every command currently accessible${args[0] == '-a' && admins.includes(message.author.id) ? ' (admin commands hidden)' : ''}.\n`)
        .setColor('BLURPLE')
};

module.exports = {
    name:'help',
    aliases:['?'],
    admin:false,
    desc:'A list of every command.',
    usage:'!help [command]',
    async execute(message,args,ex){
        const {admins} = await readJSON('config.json');
        const userdata = await userdb.get();

        if((args[0] == '-a' && admins.includes(message.author.id)) || !args[0]){
            // Construct help menu:
            const embeds = [baseEmbed(message,args,admins)];
            let currentEmbed = 0;
            let currentEmbedCommands = 0;

            for(const [key,cmd] of ex.commands.entries()){
                if(!cmd) continue;
                if(cmd.hidden) continue;
                if(cmd.admin && (!admins.includes(message.author.id) || args.includes('-a'))) continue;
                if(cmd.owner && message.author.id !== admins[0]) continue;
                if(cmd.feature && (!userdata.unlocked.features.includes(cmd.feature) || !admins.includes(message.author.id))) continue;

                if(currentEmbedCommands >= 6){
                    embeds.push(baseEmbed(message,args,admins));
                    currentEmbed += 1;
                    currentEmbedCommands = 0;
                };

                embeds[currentEmbed].setDescription(embeds[currentEmbed].description + `\n**!${cmd.name}**:\nDescription: ${cmd.desc}\nUsage: \`${cmd.usage}\`\n`);
                currentEmbedCommands += 1;
            };

            // Handle pages:
            let page = 0;
            const msg = await message.channel.send({embed:embeds[page].setFooter(`Page: ${page + 1}/${embeds.length}`)});

            const emojis = ['⬅️','➡️'];
            await msg.react(emojis[0]);
            await msg.react(emojis[1]);
            const collector = msg.createReactionCollector(async (reaction, user) => user.id == message.author.id && emojis.includes(reaction.emoji.name), {time:300000});
            collector.on('collect', async (reaction, user) => {
                if(reaction.emoji.name == emojis[0]){
                    page -= 1;
                    if(page < 0) page = embeds.length - 1;
                };
                if(reaction.emoji.name == emojis[1]){
                    page += 1;
                    if(page >= embeds.length) page = 0;
                };
                await msg.edit({embed:embeds[page].setFooter(`Page: ${page + 1}/${embeds.length}`)});
                await reaction.users.remove(user.id);
            });
            collector.on('stop', async (collected, reason) => {
                try {
                    return msg.reactions.removeAll();
                } catch {
                    return true;
                };
            });
        } else {
            // Singular command help:
            const commandName = args.shift().toLowerCase();
            const command = ex.commands.get(commandName) || ex.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            if(command){
                if(command.admin && !admins.includes(message.author.id)) return message.channel.send(`There is no command with that name.`);
                if(command.feature && (!userdata.unlocked.features.includes(command.feature) || !admins.includes(message.author.id))) return message.channel.send(`You don't have access to this command.`);
                let msg = new MessageEmbed()
                    .setColor('#3F3FFF')
                    .setTitle(`Help interface: ${command.name}`)
                    .addField(`Description:`,`${command.desc}`)
                    .addField(`Usage:`,`\`${command.usage}\` `)
                    .setTimestamp();
                if(command.aliases && command.aliases.length > 0) msg.addField(`Aliases:`,command.aliases.join('; '));
                return message.channel.send({embed:msg,split:true});
            };
            return message.channel.send(`There is no command with that name.`);
        };
    }
};