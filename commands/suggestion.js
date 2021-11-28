const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { readJSON } = require('../json.js');
const Keyv = require('keyv');
const { updateSuggestion } = require("../functions.js");
const Locale = require('../classes/locale.js');

const guilddb = new Keyv('sqlite://data/users.sqlite', {namespace:'guilds'});

module.exports = {
    name: 'suggestion',
    aliases: ['suggest'],
    desc: 'Suggestions.',
    usage: '/suggestion [create/remove/note]',
    options: [
        {
            "name": "create",
            "description": "Create a suggestion.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "suggestion",
                    "description": "The suggestion itself. 20 character minimum.",
                    "type": "STRING",
                    "required": true
                },
                {
                    "name": "category",
                    "description": "The category of your suggestion.",
                    "type": "STRING",
                    "choices": [
                        {
                            "name": "Server",
                            "value": "Server"
                        },
                        {
                            "name": "Clan",
                            "value": "Clan"
                        }
                    ],
                    "required": true
                },
                {
                    "name": "title",
                    "description": "The title of the suggestion, optional. 4 character minimum.",
                    "type": "STRING",
                    "required": false
                },
                {
                    "name": "example",
                    "description": "An example of the suggestion, optional. 20 character minimum.",
                    "type": "STRING",
                    "required": false
                },
                {
                    "name": "image",
                    "description": "An image demonstrating the suggestion, optional.",
                    "type": "STRING",
                    "required": false
                }
            ]
        },
        {
            "name": "remove",
            "description": "Remove a previous suggestion.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "message-id",
                    "description": "The message ID of your suggestion to remove.",
                    "type": "STRING",
                    "required": true
                }
            ]
        },
        {
            "name": "note",
            "description": "Add a note to your suggestion.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "message-id",
                    "description": "The message ID of your suggestion to add a note to.",
                    "type": "STRING",
                    "required": true
                },
                {
                    "name": "note",
                    "description": "The note itself. 10 character minimum.",
                    "type": "STRING",
                    "required": true
                }
            ]
        },
        {
            "name": "staffnote",
            "description": "Add a staff note to a suggestion.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "message-id",
                    "description": "The message ID of the suggestion to add a note to.",
                    "type": "STRING",
                    "required": true
                },
                {
                    "name": "note",
                    "description": "The note itself. 10 character minimum.",
                    "type": "STRING",
                    "required": true
                }
            ]
        }
    ],
    execute: async ({interaction, userdata}) => {
        if(!interaction) return Locale.text(userdata.locale, "SLASH_COMMAND_ONLY");
        const { suggestionsChannel, admins } = await readJSON('config.json');

        if(interaction.options.getSubcommand(false) == 'create'){
            const suggestion = interaction.options.getString('suggestion');
            const category = interaction.options.getString('category');
            if(suggestion.length < 20) return {content: Locale.text(userdata.locale, "SUGGESTION_MIN"), ephemeral: true};
            if(suggestion.length > 1500) return {content: Locale.text(userdata.locale, "SUGGESTION_MAX"), ephemeral: true};

            // Optionals:
            const title = interaction.options.getString('title', false);
            if(title && title.length < 4) return {content: Locale.text(userdata.locale, "SUGGESTION_TITLE_MIN"), ephemeral: true};
            if(title && title.length > 50) return {content: Locale.text(userdata.locale, "SUGGESTION_TITLE_MAX"), ephemeral: true};
            const example = interaction.options.getString('example', false);
            if(example && example.length < 20) return {content: Locale.text(userdata.locale, "SUGGESTION_EXAMPLE_MIN"), ephemeral: true};
            if(suggestion.length > 750) return {content: Locale.text(userdata.locale, "SUGGESTION_EXAMPLE_MAX"), ephemeral: true};
            const image = interaction.options.getString('image', false);
            if(image && !image.match(/\.(jpeg|jpg|gif|png)$/)) return {content: Locale.text(userdata.locale, "SUGGESTION_IMAGE_FORMAT"), ephemeral: true};

            const embed = new MessageEmbed() // Suggestions will always be in English!
                .setTitle(title ? `Suggestion: ${title}` : `Suggestion:`)
                .setDescription(`**Category:** ${category}\n\n**Description:**\n${suggestion}${example ? `\n\n**Example:**\n${example}` : ``}`)
                .setAuthor(interaction.user.tag, interaction.user.avatarURL())
                .setColor('#222277')
                .setTimestamp();
            if(image) embed.setImage(image);
            
            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('suggestion-negative')
                    .setStyle('DANGER')
                    .setLabel('Boo!'),
                new MessageButton()
                    .setCustomId('suggestion-positive')
                    .setStyle('SUCCESS')
                    .setLabel('Great!')
            );
            
            try {
                const channel = await interaction.client.channels.fetch(suggestionsChannel);
                if(!channel) return {content: Locale.text(userdata.locale, "SUGGESTION_CHANNEL_ERROR"), ephemeral: true};
                const message = await channel.send({embeds: [embed], components: [row]});
                await message.edit({embeds: [embed.setFooter(`Message ID: ${message.id}`)], components: [row]})
                await guilddb.set(`${interaction.guild.id}/Suggestions/${message.id}`, {
                    voters: [],
                    positive: 0,
                    negative: 0,
                    notes: [],
                    staffnote: ''
                });
                return {content: Locale.text(userdata.locale, "SUGGESTION_CREATED", channel), ephemeral: true};
            } catch {
                return {content: Locale.text(userdata.locale, "SUGGESTION_IMAGE_ERROR"), ephemeral: true};
            };
        } else if(interaction.options.getSubcommand(false) == 'remove'){
            const channel = await interaction.client.channels.fetch(suggestionsChannel);
            if(!channel) return Locale.text(userdata.locale, "INVALID_CHANNEL");
            const id = interaction.options.getString('message-id');
            const message = await channel.messages.fetch(id);
            if(!message) return Locale.text(userdata.locale, "INVALID_MESSAGE");
            if(message.author.id != interaction.user.id && !admins.includes(interaction.user.id)) return Locale.text(userdata.locale, "SUGGESTION_NOT_FOR_YOU");
            await message.delete();
            return Locale.text(userdata.locale, "SUGGESTION_REMOVED");
        } else if(interaction.options.getSubcommand(false) == 'note'){
            const channel = await interaction.client.channels.fetch(suggestionsChannel);
            if(!channel) return Locale.text(userdata.locale, "INVALID_CHANNEL");
            const id = interaction.options.getString('message-id');
            const message = await channel.messages.fetch(id);
            if(!message) return Locale.text(userdata.locale, "INVALID_MESSAGE");
            if(message.author.id != interaction.user.id && !admins.includes(interaction.user.id)) returnLocale.text(userdata.locale, "SUGGESTION_NOT_FOR_YOU");
            const data = await guilddb.get(`${interaction.guild.id}/Suggestions/${message.id}`);
            data.notes.push(interaction.options.getString('note'));
            await guilddb.set(`${interaction.guild.id}/Suggestions/${message.id}`, data);
            await updateSuggestion(data, message);
            return Locale.text(userdata.locale, "SUGGESTION_NOTE_ADDED");
        } else if(interaction.options.getSubcommand(false) == 'staffnote'){
            if(!admins.includes(interaction.user.id)) return Locale.text(userdata.locale, "ADMIN_ERROR");
            const channel = await interaction.client.channels.fetch(suggestionsChannel);
            if(!channel) return Locale.text(userdata.locale, "INVALID_CHANNEL");
            const id = interaction.options.getString('message-id');
            const message = await channel.messages.fetch(id);
            if(!message) return Locale.text(userdata.locale, "INVALID_MESSAGE");
            const data = await guilddb.get(`${interaction.guild.id}/Suggestions/${message.id}`);
            data.staffnote = interaction.options.getString('note');
            data.staffnoteTime = Math.floor(Date.now() / 1000);
            await guilddb.set(`${interaction.guild.id}/Suggestions/${message.id}`, data);
            await updateSuggestion(data, message);
            return Locale.text(userdata.locale, "SUGGESTION_STAFFNOTE_SET");
        } else return Locale.text(userdata.locale, "HOW_DID_WE_GET_HERE");
    }
};