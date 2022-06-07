const { readJSON } = require('../json.js');
const Locale = require('../classes/locale.js');

module.exports = {
    name: 'toggle',
    desc: `A command for toggling some specific roles, used for pings.`,
    usage: '/toggle [clanbattles/qotd/polls]',
    options: [
        {
            "name": "role",
            "description": "Choose which role to toggle.",
            "type": "STRING",
            "required": true,
            "choices": [
                {
                    "name": "Clan Battles",
                    "value": "clanbattles"
                },
                {
                    "name": "Question of the Day",
                    "value": "qotd"
                },
                {
                    "name": "Polls",
                    "value": "polls"
                }
            ]
        }
    ],
    execute: async ({interaction, message, args, userdata}) => {
        if(!args[0]) return `${Locale.text(userdata.settings.locale, "USAGE")} ${module.exports.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        if(guild.id !== '636986136283185172') return Locale.text(userdata.settings.locale, "SERVER_ERROR");
        const roles = await readJSON('json/toggles.json');
        let roletoggle;
        for(const roleinfo of roles){
            if(roleinfo.toggle.includes(args[0])){
                roletoggle = roleinfo;
                break;
            };
        };
        if(!roletoggle) return `${Locale.text(userdata.settings.locale, "USAGE")} ${module.exports.usage}`;
        const member = interaction?.member ?? message?.member;
        if(member.roles.cache.has(roletoggle.id)) await member.roles.remove(roletoggle.id);
        else await member.roles.add(roletoggle.id);
        return Locale.text(userdata.settings.locale, "TOGGLE_SUCCESS", roletoggle.name);
    }
};