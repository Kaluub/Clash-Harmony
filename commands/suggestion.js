const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { readJSON } = require('../json.js');
const Keyv = require('keyv');
const { updateSuggestion } = require("../functions.js");

const guilddb = new Keyv('sqlite://data/users.sqlite', {namespace:'guilds'});

module.exports = {
    name: 'suggestion',
    aliases: ['suggest'],
    desc: 'Suggestions.',
    usage: '/suggestion [create/remove/note]',
    admin: true,
    execute: async ({interaction}) => {
        if(!interaction) return 'You can only use this as a slash command.';
        const { suggestionsChannel, admins } = await readJSON('config.json');
        if(interaction.options.getSubcommand(false) == 'create'){
            const suggestion = interaction.options.getString('suggestion');
            if(suggestion.length < 20) return {content: 'Your suggestion should be 20+ characters to avoid low quality suggestions.', ephemeral: true};
            if(suggestion.length > 1500) return {content: 'Your suggestion should be under 1500 characters due to Discord limitations.', ephemeral: true};
            const category = interaction.options.getString('category');


            // Optionals:
            const title = interaction.options.getString('title', false);
            if(title && title.length < 4) return {content: 'Your title should be 4+ characters to avoid low quality suggestions.', ephemeral: true};
            if(title && title.length > 50) return {content: 'Your title should be under 50 characters due to Discord limitations.', ephemeral: true};
            const example = interaction.options.getString('example', false);
            if(example && example.length < 20) return {content: 'Your example should be 20+ characters to avoid low quality suggestions.', ephemeral: true};
            if(suggestion.length > 750) return {content: 'Your example should be under 750 characters due to Discord limitations.', ephemeral: true};
            const image = interaction.options.getString('image', false);
            if(image && !image.match(/\.(jpeg|jpg|gif|png)$/)) return {content: 'Your image URL must end in one of: `.jpeg`; `.jpg`; `.gif`; `.png`.', ephemeral: true};

            const embed = new MessageEmbed()
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
                if(!channel) return {content: 'The suggestions channel was unable to be fetched.', ephemeral: true};
                const message = await channel.send({embeds: [embed], components: [row]});
                await message.edit({embeds: [embed.setFooter(`Message ID: ${message.id}`)], components: [row]})
                await guilddb.set(`${interaction.guild.id}/Suggestions/${message.id}`, {
                    voters: [],
                    positive: 0,
                    negative: 0,
                    notes: [],
                    staffnote: ''
                });
                return {content: `Successfully sent your suggestion to ${channel}!`, ephemeral: true};
            } catch {
                return {content: 'Invalid image.', ephemeral: true};
            };
        } else if(interaction.options.getSubcommand(false) == 'remove'){
            const channel = await interaction.client.channels.fetch(suggestionsChannel);
            if(!channel) return 'Invalid channel.';
            const id = interaction.options.getString('message-id');
            const message = await channel.messages.fetch(id);
            if(!message) return 'Invalid message.';
            if(message.author.id != interaction.user.id && !admins.includes(interaction.user.id)) return 'This is not your suggestion.';
            await message.delete();
            return 'Suggestion removed.';
        } else if(interaction.options.getSubcommand(false) == 'note'){
            const channel = await interaction.client.channels.fetch(suggestionsChannel);
            if(!channel) return 'Invalid channel.';
            const id = interaction.options.getString('message-id');
            const message = await channel.messages.fetch(id);
            if(!message) return 'Invalid message.';
            if(message.author.id != interaction.user.id && !admins.includes(interaction.user.id)) return 'This is not your suggestion.';
            const data = await guilddb.get(`${interaction.guild.id}/Suggestions/${message.id}`);
            data.notes.push(interaction.options.getString('note'));
            await guilddb.set(`${interaction.guild.id}/Suggestions/${message.id}`, data);
            await updateSuggestion(data, message);
            return 'Added a note to the suggestion.';
        } else if(interaction.options.getSubcommand(false) == 'staffnote'){
            if(!admins.includes(interaction.user.id)) return 'Unable to use this command.';
            const channel = await interaction.client.channels.fetch(suggestionsChannel);
            if(!channel) return 'Invalid channel.';
            const id = interaction.options.getString('message-id');
            const message = await channel.messages.fetch(id);
            if(!message) return 'Invalid message.';
            const data = await guilddb.get(`${interaction.guild.id}/Suggestions/${message.id}`);
            data.staffnote = interaction.options.getString('note');
            data.staffnoteTime = Math.floor(Date.now() / 1000);
            await guilddb.set(`${interaction.guild.id}/Suggestions/${message.id}`, data);
            await updateSuggestion(data, message);
            return 'Set a staff note to the suggestion.';
        } else return `How did we get here?`;
    }
};