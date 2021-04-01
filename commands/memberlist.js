const functions = require('../functions.js');
const {readJSON, writeJSON} = require('../json.js');

module.exports = {
    name:'memberlist',
    aliases:['ml'],
    admin:true,
    desc:'This command is used to generate a new member list. To update any previous member list, use `!ul [clash/harmony]`',
    usage:'!ml [clash/harmony]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        if(args[0] != 'clash' && args[0] != 'harmony') return message.channel.send('Usage: ' + this.usage);
        let embed = await functions.updateMembers(await message.client.guilds.fetch('636986136283185172'),args[0]);
        let msg = await message.channel.send({embed:embed});
        let config = await readJSON('config.json');
        if(args[0] == 'clash'){
            config.clashMembersMessage = new String(msg.id);
            config.clashMembersMessageChannel = new String(msg.channel.id);
        }else{
            config.harmonyMembersMessage = new String(msg.id);
            config.harmonyMembersMessageChannel = new String(msg.channel.id);
        };
        writeJSON('config.json',config);
    }
};