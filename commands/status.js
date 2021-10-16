const Data = require('../classes/data.js');

module.exports = {
    name:'status',
    aliases:['st'],
    admin:false,
    desc:'This command is used to set your custom status displayed on your profile card.',
    usage:'/status [reset/text (60 character limit)]',
    options: [
        {
            "name": "text",
            "description": "The text you wish to use as your status. 60 characters maximum.",
            "type": "STRING",
            "required": true
        }
    ],
    execute: async ({interaction,message,args}) => {
        if(!args[0]) return `Usage: ${module.exports.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let userdata = await Data.get(guild.id, member.user.id);
        let status;
        if(args[0] == 'reset' && !args.includes('-f')) status = '';
        else status = args.filter(str => str !== '-f').join(' ');
        if(status.length > 60) return `Usage: ${module.exports.usage}`;
        userdata.status = status;
        await Data.set(guild.id, member.user.id, userdata);
        return {
            content: status.length < 1 ? 'Your status was reset.' : `Your status (/profile) was set to: ${status}`, 
            disableMentions: 'all'
        };
    }
};