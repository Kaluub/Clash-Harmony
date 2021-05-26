const functions = require('../functions.js');
const {readJSON, writeJSON} = require('../json.js');

module.exports = {
    name:'memberlist',
    aliases:['ml'],
    admin:true,
    desc:'This command is used to generate a new member list. To update any previous member list, use `!ul [clash/harmony]`',
    usage:'!ml [clash/harmony]',
    async execute({interaction,message,args}){
        if(!args[0]) return `Usage: ${this.usage}`;
        if(args[0] != 'clash' && args[0] != 'harmony') return `Usage: ${this.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        let embed = await functions.updateMembers(guild,args[0]);
        if(!embed) return `An error occured while using this command.`;
        let config = await readJSON('config.json');
        if(args[0] == 'clash'){
            config.clashMembersMessage = new String(msg.id);
            config.clashMembersMessageChannel = new String(msg.channel.id);
        }else{
            config.harmonyMembersMessage = new String(msg.id);
            config.harmonyMembersMessageChannel = new String(msg.channel.id);
        };
        writeJSON('config.json',config);
        return embed;
    }
};