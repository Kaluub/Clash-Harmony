const Locale = require("../classes/locale.js");

module.exports = {
    name: "edit",
    execute: async ({interaction, userdata, args}) => {
        const content = interaction.fields.getTextInputValue("edit-content");
        const channel = await interaction.client.channels.fetch(args[0]);
        const message = await channel.messages.fetch(args[1]);
        if(!channel) return Locale.text("INVALID_CHANNEL");
        if(!message) return Locale.text("INVALID_MESSAGE");
        if(!message.editable) return Locale.text("EDIT_NOT_EDITABLE");
        await message.edit({content});
        return {content: Locale.text(userdata.settings.locale, "EDIT_SUCCESS", message.url)};
    }
}