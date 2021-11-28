const functions = require('../../functions.js');
const { readJSON, writeJSON } = require('../../json.js');

module.exports = {
    name: 'list/create',
    execute: async ({interaction}) => {
        if(interaction.guild != '636986136283185172') return 'This can only be used in the Clash & Harmony discord server.';
        const clan = interaction.options.getString('clan');
        const main = interaction.options.getBoolean('main');
        const embed = await functions.updateMembers(interaction.guild, clan);
        if(!embed) return `An error occured while using this command.`;

        let config = await readJSON('config.json');
        if(main) {
            if(clan == 'clash') {
                config.clashMembersMessage = new String(msg.id);
                config.clashMembersMessageChannel = new String(msg.channel.id);
            } else {
                config.harmonyMembersMessage = new String(msg.id);
                config.harmonyMembersMessageChannel = new String(msg.channel.id);
            };
        };
        writeJSON('config.json', config);
        return {embeds: [embed]};
    }
};