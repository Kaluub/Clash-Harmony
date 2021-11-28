const { MessageEmbed } = require('discord.js');
const StatusLogger = require('../../classes/statusLogger.js');

module.exports = {
    name: 'logs/status',
    execute: async ({ interaction }) => {
        const filteredLogs = StatusLogger.filterLogs({
            timestamp: interaction.options?.getString("timestamp", false),
            type: interaction.options?.getString("type", false)
        }).slice(-15);

        if(!filteredLogs.length) return `There are no entries with your current filter!`;

        const embed = new MessageEmbed()
            .setColor('#4499DD')
            .setTitle('Logs:')
            .setDescription(`Last ${filteredLogs.length} ${filteredLogs.length > 1 ? 'entries' : 'entry'} with your current filter:`)
            .setTimestamp();

        for(const log of filteredLogs) {
            embed.setDescription(embed.description + `\n\n${log.type}: ${log.detail} (<t:${Math.floor(log.timestamp / 1000)}>, <t:${Math.floor(log.timestamp / 1000)}:R>)`);
        };

        return {embeds:[embed]};
    }
};