const { MessageEmbed } = require("discord.js");

module.exports = {
    name:'tutorial',
    aliases:['tut'],
    admin:false,
    desc:'This command is used to view the tutorial.',
    usage:'!tutorial',
    async execute(message,args){
        const embeds = [
            new MessageEmbed()
                .setTitle(`Tutorial`)
                .setColor(`#FF6961`)
                .setDescription(`Welcome to the bots tutorial.\nThis bot is designed as a reward for the users of this server, both in their participation & engagement with the bot as well as activities in the clan.\n\nTo proceed with the tutorial, react with the ➡️ emoji below.\nTo go back a page, react with the ⬅️ emoji below.`),
            new MessageEmbed()
                .setTitle(`Tutorial: Mod Mail`)
                .setColor(`#FFB347`)
                .setDescription(`This bot features a mod-mail system.\nTo use it, DM the bot with a message that you would wish to send to the staff of the Clash & Harmony clans.\nYou may also add a category.`)
                .setImage(`https://cdn.discordapp.com/attachments/807311206888636457/829533051083030548/Using_Mod_Mail.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Profile Card Basics`)
                .setColor(`#FDFD96`)
                .setDescription(`Profile cards can be rendered using the command \`!profile\`.\nHere's a diagram showing the components of the player card:`)
                .setImage(`https://cdn.discordapp.com/attachments/807311206888636457/829523758363967529/Card_Diagram.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Points`)
                .setColor(`#77DD77`)
                .setDescription(`Points are earned through two main methods:\n • The monthly reward (!monthly)\n • Various clan-related events\nYou can spend your points on card customization options or roles using \`!shop\`.`)
                .setImage(`https://cdn.discordapp.com/attachments/807311206888636457/829526293435383848/Shop_Demo.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Customizing Profile Card`)
                .setColor(`#AEC6CF`)
                .setDescription(`Player cards can be customized using the command \`!custom\`.\nYou need to purchase the reward using points through \`!shop\` before using them.`)
                .setImage(`https://cdn.discordapp.com/attachments/807311206888636457/829527400348909569/Customizing_Profile_Card.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Setting Status`)
                .setColor(`#C3B1E1`)
                .setDescription(`You can set a custom status that will be displayed on your profile card for others to see. To set one, use the command \`!status [message]\`. Please note that statuses have a 60 character limit.`)
                .setImage(`https://cdn.discordapp.com/attachments/807311206888636457/830544658488360970/Statuses.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Viewing Reward Info`)
                .setColor(`#99A8D1`)
                .setDescription(`You can view details such as the price, description, and image from any reward by using \`!info [reward name]\`.`)
                .setImage(`https://cdn.discordapp.com/attachments/807311206888636457/830544149224357888/Info_Menu.png`),
            new MessageEmbed()
                .setTitle(`Tutorial: Viewing All Commands`)
                .setColor(`#A9A9A9`)
                .setDescription(`To view every usable command, you can use \`!help\`. From there, a message containing all commands will be shown.`)
                .setImage(`https://cdn.discordapp.com/attachments/807311206888636457/830543900976349204/Help_Menu.png`)
        ];
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
    }
};