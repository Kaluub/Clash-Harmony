const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});
const {readJSON} = require('../json.js');

function baseEmbed(id,args,admins){
    return new MessageEmbed()
        .setTitle(`Help Interface:`)
        .setDescription(`Here is a list of every command currently accessible${args[0] == '-a' && admins.includes(id) ? ' (admin commands hidden)' : ''}.\n`)
        .setColor('BLURPLE')
};

module.exports = {
    name:'help',
    aliases:['?'],
    admin:false,
    desc:'A list of every command.',
    usage:'!help [command]',
    execute: async ({interaction,message,args}) => {
        const {admins} = await readJSON('config.json');
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        const userdata = await userdb.get(`${guild.id}/${member.user.id}`);

        if((args[0] == '-a' && admins.includes(member.user.id)) || !args[0]){
            // Construct help menu:
            const embeds = [baseEmbed(member.user.id,args,admins)];
            let currentEmbed = 0;
            let currentEmbedCommands = 0;

            for(const [key,cmd] of member.client.commands.entries()){
                if(!cmd) continue;
                if(cmd.hidden) continue;
                if(cmd.admin && (!admins.includes(member.user.id) || args.includes('-a'))) continue;
                if(cmd.owner && member.user.id !== admins[0]) continue;
                if(cmd.feature && (!userdata.unlocked.features.includes(cmd.feature) || !admins.includes(member.user.id))) continue;

                if(currentEmbedCommands >= 6){
                    embeds.push(baseEmbed(member.user.id,args,admins));
                    currentEmbed += 1;
                    currentEmbedCommands = 0;
                };

                embeds[currentEmbed].setDescription(embeds[currentEmbed].description + `\n**!${cmd.name}**:\nDescription: ${cmd.desc}\nUsage: \`${cmd.usage}\`\n`);
                currentEmbedCommands += 1;
            };

            // Handle pages:
            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('back')
                    .setLabel('Back')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle('PRIMARY')
            );

            let page = 0;
            let msg;

            if(message){
                msg = await message?.channel.send({embeds:[embeds[page].setFooter(`Page: ${page + 1}/${embeds.length}`)], components: [row]});
            } else {
                await interaction?.reply({embeds:[embeds[page].setFooter(`Page: ${page + 1}/${embeds.length}`)], components: [row]});
                msg = await interaction?.fetchReply();
            };

            const collector = msg.createMessageComponentCollector({filter: interaction => interaction.user.id == member.user.id, idle: 30000});
            collector.on('collect', async (interaction) => {
                if(interaction.customId == 'back'){
                    page -= 1;
                    if(page < 0) page = embeds.length - 1;
                };
                if(interaction.customId == 'next'){
                    page += 1;
                    if(page >= embeds.length) page = 0;
                };
                await interaction.update({embeds:[embeds[page].setFooter(`Page: ${page + 1}/${embeds.length}`)]});
            });
            collector.on('end', async (res) => {
                if(!msg.deleted) await msg.edit({embeds:[embeds[page].setFooter(`Page: ${page + 1}/${embeds.length} | EXPIRED`)], components: []});
            });
        } else {
            // Singular command help:
            const commandName = args.shift().toLowerCase();
            const command = member.client.commands.get(commandName) || member.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            if(command){
                if(command.admin && !admins.includes(member.user.id)) return `There is no command with that name.`;
                if(command.feature && (!userdata.unlocked.features.includes(command.feature) || !admins.includes(member.user.id))) return `You don't have access to this command.`;
                let msg = new MessageEmbed()
                    .setColor('#3F3FFF')
                    .setTitle(`Help interface: ${command.name}`)
                    .addField(`Description:`,`${command.desc}`)
                    .addField(`Usage:`,`\`${command.usage}\` `)
                    .setTimestamp();
                if(command.aliases && command.aliases.length > 0) msg.addField(`Aliases:`,command.aliases.join('; '));
                return {embeds:[msg]};
            };
            return `There is no command with that name.`;
        };
    }
};