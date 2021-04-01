const functions = require('../functions.js');
const {readJSON} = require('../json.js');

module.exports = {
    name:'updatelist',
    aliases:['ul'],
    admin:true,
    desc:'This command is used to update an existing member list. To create a new member list, use `!ml [clash/harmony]`.',
    usage:'!ul [clash/harmony]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        if(args[0] != 'clash' && args[0] != 'harmony') return message.channel.send('Usage: ' + this.usage);
        const config = await readJSON('config.json');
        const channel = await message.client.channels.fetch(config[args[0] == 'clash' ? 'clashMembersMessageChannel' : 'harmonyMembersMessageChannel']);
        const msg = await channel.messages.fetch(config[args[0] == 'clash' ? 'clashMembersMessage' : 'harmonyMembersMessage']);
        let embed = await functions.updateMembers(await message.client.guilds.fetch('636986136283185172'),args[0]);
        await msg.edit({embed:embed});
        return message.channel.send('Updated the member list.');
    }
};