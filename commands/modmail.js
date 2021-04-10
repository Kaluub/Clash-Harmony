const {readJSON, writeJSON} = require('../json.js');

module.exports = {
    name:'modmail',
    admin:true,
    desc:'This command is used to change the mod-mail channel.',
    usage:'!modmail [#channel]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        let channel = message.mentions.channels.first();
        if(!channel) return message.channel.send(`Usage: ${this.usage}`);
        let config = await readJSON('config.json');
        message.channel.send(`Successfully set the mod-mail channel to ${channel}.`);
        config.modMailChannel = new String(channel.id);
        writeJSON('config.json',config);
    }
};