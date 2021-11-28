const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
    name: 'messages/send',
    execute: async ({interaction}) => {
        let channel = await interaction.client.channels.fetch(interaction.options.getString('id'));
        if(!channel) channel = await interaction.client.users.fetch(interaction.options.getString('id'));
        if(!channel) return 'There was no match for this channel or user ID.';
        
        const ephemeral = interaction.options.getBoolean('hide-response') ?? false;

        const content = interaction.options.getString('content', false);
        const linkData = interaction.options.getString('links', false);
        const row = new MessageActionRow();
        if (linkData) {
            const links = linkData.split(';');
            if (links.length > 5 || links.length < 1) throw 'Syntax error: Between 1 to 5 links must be included, if any.';
            for (const i of links) {
                const data = i.split(',');
                if (data.length !== 2) throw "Syntax error: Please use the 'title,url;title2,url2' format.";
                row.addComponents(
                    new MessageButton()
                        .setStyle("LINK")
                        .setLabel(data[0])
                        .setURL(data[1])
                );
            };
        };

        let send = {content: content};
        if(row.components.length) send.components = [row];
        
        try{
            await channel.send(send);
        } catch(err) {
            return {content: `Couldn't send a message to this channel/user.\n\nDetail:\n\`\`\`${err}\`\`\``, ephemeral};
        };
        
        return {content: `Sent a message to ${channel}.`, ephemeral};
    }
};