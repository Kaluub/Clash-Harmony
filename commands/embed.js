const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const Locale = require('../classes/locale.js');

module.exports = {
    name: 'embed',
    desc: 'A command used to generate and send embed messages.',
    usage: '/embed [values]',
    admin: true,
    options: [
        {
            "name": "description",
            "description": "The description of the embed.",
            "type": "STRING",
            "required": true
        },
        {
            "name": "title",
            "description": "The title of the embed.",
            "type": "STRING",
            "required": false
        },
        {
            "name": "color",
            "description": "The hex color code for the embed.",
            "type": "STRING",
            "required": false
        },
        {
            "name": "image",
            "description": "The image URL for the embed.",
            "type": "STRING",
            "required": false
        },
        {
            "name": "url",
            "description": "The URL of the title for the embed.",
            "type": "STRING",
            "required": false
        },
        {
            "name": "author",
            "description": "The author of the embed (JSON object).",
            "type": "STRING",
            "required": false
        },
        {
            "name": "footer",
            "description": "The footer of the embed (JSON object).",
            "type": "STRING",
            "required": false
        },
        {
            "name": "fields",
            "description": "The fields to add to the embed (JSON array).",
            "type": "STRING",
            "required": false
        },
        {
            "name": "timestamp",
            "description": "The time of the embed. Valid Date number. If the number '0' is provided, the curent time is used.",
            "type": "STRING",
            "required": false
        },
        {
            "name": "links",
            "description": "Up to 5 links can be included as buttons. Format: 'title,url;title2,url2'.",
            "type": "STRING",
            "required": false
        }
    ],
    execute: async ({interaction, userdata}) => {
        if(!interaction) return Locale.text(userdata.settings.locale, "SLASH_COMMAND_ONLY");
        const embed = new MessageEmbed();
        const row = new MessageActionRow();
        for(const id in interaction.options.data){
            const option = interaction.options.data[id];
            try {
                if(option.name == 'title') embed.setTitle(option.value);
                if(option.name == 'description') embed.setDescription(option.value);
                if(option.name == 'color') embed.setColor(option.value);
                if(option.name == 'image') embed.setImage(option.value);
                if(option.name == 'url') embed.setURL(option.value);
                if(option.name == 'author') embed.setAuthor(JSON.parse(option.value));
                if(option.name == 'footer') embed.setFooter(JSON.parse(option.value));
                if(option.name == 'fields') embed.addFields(JSON.parse(option.value));
                if(option.name == 'timestamp') embed.setTimestamp(parseInt(option.value) == 0 ? Date.now() : parseInt(option.value));
                if(option.name == 'links') {
                    const links = option.value.split(';');
                    if (links.length > 5 || links.length < 1) throw Locale.text(userdata.settings.locale, "EMBED_LINK_ERROR");
                    for (const i of links) {
                        const data = i.split(',');
                        if (data.length !== 2) throw Locale.text(userdata.settings.locale, "EMBED_LINK_FORMAT_ERROR");
                        row.addComponents(
                            new MessageButton()
                                .setStyle("LINK")
                                .setLabel(data[0])
                                .setURL(data[1])
                        );
                    };
                };
            } catch(err) {
                return {content: Locale.text(userdata.settings.locale, "EMBED_OPTION_ERROR", option.name, err), ephemeral: true};
            };
        };

        let send = {embeds: [embed]};
        if(row.components.length) send.components = [row];

        try {
            await interaction.channel.send(send);
        } catch(err) {
            return {content: Locale.text(userdata.settings.locale, "EMBED_ERROR", err), ephemeral: true};
        };
        return {content: Locale.text(userdata.settings.locale, "EMBED_SUCCESS"), ephemeral: true};
    }
};