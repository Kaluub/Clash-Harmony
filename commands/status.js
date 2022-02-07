const { UserData } = require('../classes/data.js');
const Locale = require('../classes/locale.js');

module.exports = {
    name: 'status',
    aliases: ['st'],
    admin: false,
    desc: 'This command is used to set your custom status displayed on your profile card.',
    usage: '/status [reset/text (60 character limit)]',
    options: [
        {
            "name": "text",
            "description": "The text you wish to use as your status. 60 characters maximum.",
            "type": "STRING",
            "required": true
        }
    ],
    execute: async ({interaction, message, args}) => {
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let userdata = await UserData.get(guild.id, member.user.id);
        if(!args[0]) return `${Locale.text(userdata.settings.locale, "USAGE")}: ${module.exports.usage}`;
        let status;
        if(args[0] == 'reset' && !args.includes('-f')) status = '';
        else status = args.filter(str => str !== '-f').join(' ');
        if(status.length > 60) return `${Locale.text(userdata.settings.locale, "USAGE")}: ${module.exports.usage}`;
        userdata.status = status;
        await UserData.set(guild.id, member.user.id, userdata);
        return {
            content: !status.length ? Locale.text(userdata.settings.locale, "STATUS_RESET") : Locale.text(userdata.settings.locale, "STATUS_SET", status), 
            disableMentions: 'all'
        };
    }
};