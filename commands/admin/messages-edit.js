const Locale = require("../../classes/locale.js");

module.exports = {
    name: 'messages/edit',
    execute: async ({interaction, userdata}) => {
        const channel = interaction.options.getChannel('channel');
        const message = await channel.messages.fetch(interaction.options.getString('message-id'));
        if(!message) return Locale.text(userdata.settings.locale, "INVALID_MESSAGE");
        if(!message.editable) return Locale.text(userdata.settings.locale, "INVALID_MESSAGE");
        await message.edit({content: interaction.options.getString('content')});

        return {content: Locale.text(userdata.settings.locale, "EDIT_SUCCESS", message.url)};
    }
};