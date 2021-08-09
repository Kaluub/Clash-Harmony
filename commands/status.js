const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'status',
    aliases:['st'],
    admin:false,
    desc:'This command is used to set your custom status displayed on your profile card.',
    usage:'/status [reset/text (60 character limit)]',
    execute: async ({interaction,message,args}) => {
        if(!args[0]) return `Usage: ${module.exports.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let userdata = await userdb.get(`${guild.id}/${member.user.id}`);
        let status;
        if(args[0] == 'reset' && !args.includes('-f')) status = '';
        else status = args.join(' ');
        if(status.length > 60) return `Usage: ${module.exports.usage}`;
        userdata.status = status;
        await userdb.set(`${guild.id}/${member.user.id}`, userdata);
        return {
            content: status.length < 1 ? 'Your status was reset.' : `Your status (/profile) was set to: ${status}`, 
            disableMentions: 'all'
        };
    }
};