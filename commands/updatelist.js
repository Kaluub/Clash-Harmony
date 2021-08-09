const {updateMembers} = require('../functions.js');
const {readJSON} = require('../json.js');

module.exports = {
    name:'updatelist',
    aliases:['ul'],
    admin:true,
    desc:'This command is used to update an existing member list. To create a new member list, use `!ml [clash/harmony]`.',
    usage:'/ul [clash/harmony]',
    execute: async ({interaction,message,args}) => {
        if(!args[0]) return `Usage: ${module.exports.usage}`;
        if(args[0] != 'clash' && args[0] != 'harmony') return `Usage: ${module.exports.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        const config = await readJSON('config.json');
        const channel = await guild.client.channels.fetch(config[args[0] == 'clash' ? 'clashMembersMessageChannel' : 'harmonyMembersMessageChannel']);
        const msg = await channel.messages.fetch(config[args[0] == 'clash' ? 'clashMembersMessage' : 'harmonyMembersMessage']);
        let embed = await updateMembers(guild,args[0]);
        await msg.edit({embeds:[embed]});
        return 'Updated the member list.';
    }
};