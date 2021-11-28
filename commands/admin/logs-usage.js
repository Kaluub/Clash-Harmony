const { MessageEmbed } = require('discord.js');
const UsageLogger = require('../../classes/usageLogger.js');

module.exports = {
    name: 'logs/usage',
    execute: async ({ interaction }) => {
        const filteredLogs = UsageLogger.filterLogs({
            guildId: interaction.options?.getString("guild-id", false),
            channelId: interaction.options?.getString("channel-id", false),
            userId: interaction.options?.getString("user-id", false),
            actionName: interaction.options?.getString("action-name", false),
        }).slice(-15);

        if(!filteredLogs.length) return `There are no entries with your current filter!`;

        const embed = new MessageEmbed()
            .setColor('#4499DD')
            .setTitle('Logs:')
            .setDescription(`Last ${filteredLogs.length} ${filteredLogs.length > 1 ? 'entries' : 'entry'} with your current filter:`)
            .setTimestamp();

        for(const log of filteredLogs) {
            const user = interaction.client.users.cache.get(log.userId);
            embed.setDescription(embed.description + `\n\n${user ? user.tag : log.userId} used \`${log.actionName}\` at <t:${Math.floor(log.timestamp / 1000)}> (<t:${Math.floor(log.timestamp / 1000)}:R>) in <#${log.channelId}>.`);
        };

        return {embeds:[embed]};
    }
};