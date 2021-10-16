const { readJSON, writeJSON } = require('../json.js');

module.exports = {
    name:'modmail',
    admin:true,
    desc:'This command is used to change the mod-mail channel.',
    usage:'/modmail [#channel]',
    options: [
        {
            "name": "channel",
            "description": "The channel to use the mod-mail feature in.",
            "type": "CHANNEL",
            "required": true
        }
    ],
    execute: async ({interaction,message,args}) => {
        if(!args[0]) return `Usage: ${module.exports.usage}`;
        let channel = message?.mentions.channels.first() ?? interaction?.options.getChannel('channel');
        if(!channel) return `Usage: ${module.exports.usage}`;
        let config = await readJSON('config.json');
        config.modMailChannel = new String(channel.id);
        writeJSON('config.json',config);
        return `Successfully set the mod-mail channel to ${channel}.`;
    }
};