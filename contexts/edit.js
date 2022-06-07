const Locale = require('../classes/locale.js');
const { Modal, TextInputComponent, MessageActionRow } = require('discord.js');

module.exports = {
    name: 'Edit message',
    type: 'MESSAGE',
    admin: true,
    execute: async ({interaction, userdata}) => {
        if(!interaction.targetMessage.editable) return Locale.text(userdata.settings.locale, "EDIT_NOT_EDITABLE");
        const editModal = new Modal()
            .setCustomId(`edit/${interaction.targetMessage.channel.id}/${interaction.targetMessage.id}`)
            .setTitle("Edit message")
        
        const contentInput = new TextInputComponent()
            .setCustomId("edit-content")
            .setLabel(Locale.text(userdata.settings.locale, "EDIT_MODAL_LABEL_1"))
            .setPlaceholder(Locale.text(userdata.settings.locale, "EDIT_MODAL_PLACEHOLDER_1"))
            .setValue(interaction.targetMessage.content)
            .setMaxLength(2000)
            .setStyle("PARAGRAPH")

        editModal.addComponents(
            new MessageActionRow().addComponents(contentInput)
        );

        return await interaction.showModal(editModal);
    }
};