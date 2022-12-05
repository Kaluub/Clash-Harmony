const Locale = require("../classes/locale.js");
const { MessageEmbed } = require("discord.js");
const { readJSON } = require('../json.js');

module.exports = {
    name: "modmail",
    execute: async ({interaction, userdata}) => {
        const category = interaction.fields.getTextInputValue("category");
        const content = interaction.fields.getTextInputValue("content");
        const color = interaction.fields.getTextInputValue("color").toUpperCase();
        const modmailEmbed = new MessageEmbed()
            .setAuthor({name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL()})
            .setDescription(`Message from ${interaction.user}:`)
            .addField("Category:", category)
            .addField("Message:", content)
        try {
            modmailEmbed.setColor(color)
        } catch {
            modmailEmbed.setColor("#FFFFFF")
        };
        const config = readJSON("config.json");
        const channel = interaction.client.channels.cache.get(config.modMailChannel);
        await channel.send({embeds: [modmailEmbed]});
        return {content: Locale.text(userdata.settings.locale, "MODMAIL_SUCCESS"), ephemeral: true};
    }
};