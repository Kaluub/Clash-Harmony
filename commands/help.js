const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { readJSON } = require('../json.js');
const Locale = require('../classes/locale.js');

function baseEmbed(locale){
    return new MessageEmbed()
        .setTitle(Locale.text(locale, "HELP_TITLE"))
        .setDescription(Locale.text(locale, "HELP_DESC"))
        .setColor('BLURPLE')
};

module.exports = {
    name: 'help',
    aliases: ['?'],
    desc: 'A list of every command.',
    usage: '/help [command]',
    execute: async ({interaction, message, userdata}) => {
        const { admins } = await readJSON('config.json');
        const member = interaction?.member ?? message?.member;

        // Construct help menu:
        const embeds = [baseEmbed(userdata.locale)];
        let currentEmbed = 0;
        let currentEmbedCommands = 0;

        for(const [key, cmd] of member.client.commands.entries()){
            if(!cmd) continue;
            if(cmd.hidden) continue;
            if(cmd.admin && !admins.includes(member.user.id)) continue;
            if(cmd.feature && (!userdata.unlocked.features.includes(cmd.feature) || !admins.includes(member.user.id))) continue;

            if(currentEmbedCommands >= 7){
                embeds.push(baseEmbed(userdata.locale));
                currentEmbed += 1;
                currentEmbedCommands = 0;
            };

            embeds[currentEmbed].setDescription(embeds[currentEmbed].description + Locale.text(userdata.locale, "HELP_ENTRY", cmd.name, cmd.desc, cmd.usage));
            currentEmbedCommands += 1;
        };

        // Handle pages:
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('back')
                .setLabel(Locale.text(userdata.locale, "BUTTON_BACK"))
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('next')
                .setLabel(Locale.text(userdata.locale, "BUTTON_NEXT"))
                .setStyle('PRIMARY')
        );

        let page = 0;
        const msg = await message?.channel.send({embeds:[embeds[page].setFooter(`${Locale.text(userdata.locale, "PAGE")}: ${page + 1}/${embeds.length}`)], components: [row]})
            ?? await interaction?.reply({embeds:[embeds[page].setFooter(`${Locale.text(userdata.locale, "PAGE")}: ${page + 1}/${embeds.length}`)], components: [row], fetchReply: true});

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
            await interaction.update({embeds:[embeds[page].setFooter(`${Locale.text(userdata.locale, "PAGE")}: ${page + 1}/${embeds.length}`)]});
        });
        collector.on('end', async () => {
            if(!msg.deleted) await msg.edit({embeds:[embeds[page].setFooter(`${Locale.text(userdata.locale, "PAGE")}: ${page + 1}/${embeds.length} | ${Locale.text(userdata.locale, "EXPIRED")}`)], components: []});
        });
    }
};