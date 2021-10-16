const functions = require('../functions.js');
const { readJSON, writeJSON } = require('../json.js');

module.exports = {
    name: 'memberlist',
    aliases: ['ml'],
    admin: true,
    desc: 'This command is used to generate a new member list.',
    usage: '/ml [clash/harmony]',
    options: [
        {
            "name": "clan",
            "description": "Choose which clan to generate the member list for.",
            "type": "STRING",
            "required": true,
            "choices": [
                {
                    "name": "clash",
                    "value": "clash"
                },
                {
                    "name": "harmony",
                    "value": "harmony"
                }
            ]
        }
    ],
    execute: async ({interaction,message,args}) => {
        if(!args[0]) return `Usage: ${module.exports.usage}`;
        if(args[0] != 'clash' && args[0] != 'harmony') return `Usage: ${module.exports.usage}`;
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
        return {embeds:[embed]};
    }
};