const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Data = require('./classes/data.js');

const categories = {
    'category-harmony-application': 'Harmony Application',
    'category-clash-application': 'Clash Application',
    'category-question': 'Question',
    'category-issue': 'Issue'
};

module.exports = async (message, modMailChannelId) => {
    const userdata = await Data.get(`636986136283185172`, message.author.id);
    if(userdata.blocked) return msg.channel.send(`You've previously been blocked from using this system. Please directly DM a staff member to help you out if this is a mistake.`);
    
    let category;
    const dmEmbed = new MessageEmbed()
        .setColor('#BBBBBB')
        .setTitle('Clash & Harmony Mod Mail system:')
        .setDescription(`**Warning**:\nSending messages in DMs will send them to the staff of the Clash & Harmony Clans.\nPlease do not abuse this system, you can be blocked from using it.\n\nTo send your message, press the ✅ button.\nTo add a category to your message, press the ⏺️ button.\nTo cancel, press the ⛔ button.`);

    const dmCategoryEmbed = new MessageEmbed()
        .setColor('#BBBBBB')
        .setTitle('Select a category:')
        .setDescription('Select a category using the buttons below.')

    const dmMainRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId('confirm')
            .setEmoji('✅')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('select-category')
            .setEmoji('⏺️')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('cancel')
            .setEmoji('⛔')
            .setStyle('DANGER')
    );

    const dmCategoryRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId('category-harmony-application')
            .setLabel('Harmony Application')
            .setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('category-clash-application')
            .setLabel('Clash Application')
            .setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('category-question')
            .setLabel('Question')
            .setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('category-issue')
            .setLabel('Issue')
            .setStyle('SECONDARY')
    );

    const sentMessage = await message.channel.send({embeds: [dmEmbed], components: [dmMainRow]});

    const collector = sentMessage.createMessageComponentCollector({filter: (int) => int.user.id === message.author.id, time: 120000});
    collector.on('collect', async interaction => {
        if(!interaction.isButton()) return;
        if(interaction.customId == 'confirm'){
            const channel = await interaction.client.channels.fetch(modMailChannelId);
            if(!channel) {
                console.log('ERROR! The mod mail channel has an issue. Message logged:\n' + message.content);
                return interaction.reply({content: 'The mod mail channel seems to have been deleted, or is simply unavailable right now. Don\'t worry! I will save your message and once this issue is over, it will be manually inserted. Apologies for the inconvenience!', ephemeral: true});
            }
            await channel.send({embeds: [new MessageEmbed()
                .setTitle('Mod Mail')
                .setColor('#338855')
                .setDescription(`Message from ${interaction.user} (${interaction.user.tag}):${category ? `\nCategory: ${category}` : '\n'}\n\n${message.content}`)
                .setTimestamp(message.createdTimestamp)
            ]});
            await interaction.update({content: 'Your message was sent!', embeds: [], components: []});
            return collector.stop();
        };
        if(interaction.customId == 'cancel'){
            await interaction.update({content: 'Your message will not be sent. If this was a mistake, resend your message and try again.', embeds: [], components: []});
            return collector.stop();
        };
        if(interaction.customId == 'select-category') return await interaction.update({embeds: [dmCategoryEmbed], components: [dmCategoryRow]});
        if(interaction.customId.startsWith('category')){
            if(!categories[interaction.customId]) return await interaction.reply({content: '🤨', ephemeral: true});
            category = categories[interaction.customId];
            await interaction.update({embeds: [dmEmbed], components: [dmMainRow]});
            return await interaction.followUp({content: `You set the category to "${category}".`, ephemeral: true});
        };
    });
    collector.on('stop', async (col, reason) => {
        if(message.components.length) await message.edit({components: message.components.forEach(row => row.components.forEach(comp => comp.setDisabled()))});
    });
};