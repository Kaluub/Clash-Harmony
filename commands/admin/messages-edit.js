const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'messages/edit',
    execute: async ({interaction}) => {
        const channel = interaction.options.getChannel('channel');
        const message = await channel.messages.fetch(interaction.options.getString('message-id'));
        if(!message) return 'Invalid message ID.';
        if(!message.editable) return 'Unable to edit this message!';
        await message.edit({content: interaction.options.getString('content')});

        const embed = new MessageEmbed()
            .setDescription(`Successfully edited the message.\nClick [here](${message.url}) to jump to the updated message.`)
            .setColor('#00AA33')
            .setTimestamp();
        return {embeds:[embed]};
    }
};