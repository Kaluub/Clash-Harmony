const {readJSON, writeJSON} = require('../json.js');

module.exports = {
    name:'modmail',
    admin:true,
    desc:'This command is used to change the mod-mail channel.',
    usage:'!modmail [#channel]',
    async execute({interaction,message,args}){
        if(!args[0]) return `Usage: ${this.usage}`;
        let channel = message?.mentions.channels.first() ?? interaction?.options[0].channel;
        if(!channel) return `Usage: ${this.usage}`;
        let config = await readJSON('config.json');
        config.modMailChannel = new String(channel.id);
        writeJSON('config.json',config);
        return `Successfully set the mod-mail channel to ${channel}.`;
    }
};