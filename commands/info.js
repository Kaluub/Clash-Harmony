const { readJSON } = require('../json.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const Locale = require('../classes/locale.js');
const { UserData } = require('../classes/data.js');

module.exports = {
    name: 'info',
    aliases: ['i'],
    desc: `This is a command for viewing the info of a reward.`,
    usage: '/info [reward name]',
    options: [
        {
            "name": "reward",
            "description": "The reward name to view the info for.",
            "type": "STRING",
            "autocomplete": true,
            "required": true
        }
    ],
    execute: async ({interaction, userdata}) => {
        if(!interaction) return Locale.text(userdata.settings.locale, "SLASH_COMMAND_ONLY");
        const rewards = await readJSON('json/rewards.json');
        const reward = interaction.options.getString('reward');
        const item = rewards[reward];
        
        if(!item) return `No reward found with the name \`${reward}\`.`;

        let query = {"_id": { $regex: new RegExp(`^${interaction.guild.id}`)}};
        query[`unlocked.${item.type}`] = item.id;
        const count = await UserData.searchCount(query);

        const embed = new MessageEmbed()
            .setColor('#662211')
            .setTitle(Locale.text(userdata.settings.locale, "INFO_TITLE", item.name))
            .setDescription(Locale.text(userdata.settings.locale, "INFO_DESC", item.name, item.desc ? item.desc : Locale.text(userdata.settings.locale, "INFO_NO_DESC"), item.price, count))

        let message = {embeds: [embed]};

        if(item.img) {
            const attachment = new MessageAttachment(`./img/${item.type}/${item.img}`);
            embed.setImage(`attachment://${item.img}`);
            message["files"] = [attachment];
        };

        return message;
    }
};