const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
    name:'tutorial',
    aliases:['tut'],
    desc:'This command is used to view the tutorial.',
    usage:'/tutorial',
    noGuild: true,
    execute: async ({interaction,message}) => {
        const embeds = [
            new MessageEmbed()
                .setTitle(`Tutorial`)
                .setColor(`#FF6961`)
                .setDescription(`Welcome to the bots tutorial.\nThis bot is designed as a reward for the users of this server, both in their participation & engagement with the bot as well as activities in the clan.\n\nTo proceed with the tutorial, use the buttons below.`),
            new MessageEmbed()
                .setTitle(`Tutorial: Mod Mail`)
                .setColor(`#FFB347`)
                .setDescription(`This bot features a mod-mail system.\nTo use it, DM the bot with a message that you would wish to send to the staff of the Clash & Harmony clans.\nYou may also add a category.`)
                .setImage(`https://cdn.discordapp.com/attachments/822280580577361941/870739087852728490/unknown.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Profile Card Basics`)
                .setColor(`#FDFD96`)
                .setDescription(`Profile cards can be rendered using the command \`!profile\`.\nHere's a diagram showing the components of the player card:`)
                .setImage(`https://cdn.discordapp.com/attachments/807311206888636457/829523758363967529/Card_Diagram.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Points`)
                .setColor(`#77DD77`)
                .setDescription(`Points are earned through two main methods:\n • The monthly reward (/monthly)\n • Various clan-related events\nYou can spend your points on card customization options or roles using \`!shop\`.`)
                .setImage(`https://cdn.discordapp.com/attachments/822280580577361941/870742292145778699/unknown.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Customizing Profile Card`)
                .setColor(`#AEC6CF`)
                .setDescription(`Player cards can be customized using the command \`/custom\`.\nYou need to purchase the reward using points through \`!shop\` before using them.`)
                .setImage(`https://cdn.discordapp.com/attachments/822280580577361941/870743311021916190/unknown.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Setting Status`)
                .setColor(`#C3B1E1`)
                .setDescription(`You can set a custom status that will be displayed on your profile card for others to see. To set one, use the command \`!status [message]\`. Please note that statuses have a 60 character limit.`)
                .setImage(`https://cdn.discordapp.com/attachments/822280580577361941/870744481144643614/unknown.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Viewing Reward Info`)
                .setColor(`#99A8D1`)
                .setDescription(`You can view details such as the price, description, and image from any reward by using \`/info [reward name]\`.`)
                .setImage(`https://cdn.discordapp.com/attachments/822280580577361941/870744715094523934/unknown.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Viewing All Commands`)
                .setColor(`#A9A9A9`)
                .setDescription(`To view every usable command, you can use \`!help\`. From there, a message containing all commands will be shown.`)
                .setImage(`https://cdn.discordapp.com/attachments/822280580577361941/870749918661337188/unknown.png`)
        ];
        let page = 0;
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

        let msg = await message?.channel.send({embeds:[embeds[page].setFooter(`Page: ${page + 1}/${embeds.length}`)], components: [row]});
        if(!msg) {
            await interaction.reply({embeds:[embeds[page].setFooter(`Page: ${page + 1}/${embeds.length}`)], components: [row]});
            msg = await interaction.fetchReply();
        };

        const member = interaction?.member ?? message?.member;
        const collector = msg.createMessageComponentCollector(interaction => interaction.user.id == member.user.id, {time:300000});
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

        collector.on('stop', async (res) => {
            if(!msg.deleted) await msg.edit({embeds:[embeds[page].setFooter(`Page: ${page + 1}/${embeds.length} | EXPIRED`)], components: []});
        });
    }
};