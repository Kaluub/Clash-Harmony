const { MessageEmbed } = require('discord.js');
const StatusLogger = require('../../classes/statusLogger.js');

module.exports = {
    name: 'logs/status',
    execute: async ({ interaction }) => {
        const filteredLogs = StatusLogger.filterLogs({
            timestamp: interaction.options?.getString("timestamp", false),
            type: interaction.options?.getString("type", false)
        });

        if(!filteredLogs.length) return `There are no entries with your current filter!`;

        const shortenedLogs = filteredLogs.slice(-15);

        const embed = new MessageEmbed()
            .setColor('#4499DD')
            .setTitle('Logs:')
            .setDescription(`Last ${shortenedLogs.length} ${shortenedLogs.length > 1 ? 'entries' : 'entry'} out of ${filteredLogs.length.toLocaleString()} with your current filter:`)
            .setTimestamp();

        for(const log of shortenedLogs) {
            embed.setDescription(embed.description + `\n\n${log.type}: ${log.detail} (<t:${Math.floor(log.timestamp / 1000)}>, <t:${Math.floor(log.timestamp / 1000)}:R>)`);
        };

        return {embeds:[embed]};
    }
};