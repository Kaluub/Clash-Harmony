const { readJSON, writeJSON } = require('../../json.js');

module.exports = {
    name: 'modmail',
    execute: async ({interaction}) => {
        let channel = interaction?.options.getChannel('channel');
        let config = await readJSON('config.json');
        config.modMailChannel = new String(channel.id);
        writeJSON('config.json', config);
        return `Successfully set the mod-mail channel to ${channel}.`;
    }
};