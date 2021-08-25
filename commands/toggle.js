const {readJSON} = require('../json.js');

module.exports = {
    name:'toggle',
    desc:`A command for toggling some specific roles, used for pings.`,
    usage:'/toggle [trivia/qotd/polls]',
    execute: async ({interaction,message,args}) => {
        if(!args[0]) return `Usage: ${module.exports.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        if(guild.id !== '636986136283185172') return `This command is only useable in the Clash & Harmony Discord server.`;
        const roles = await readJSON('json/toggles.json');
        let roletoggle;
        for(const roleinfo of roles){
            if(roleinfo.toggle.includes(args[0])){
                roletoggle = roleinfo;
                break;
            };
        };
        if(!roletoggle) return `Usage: ${module.exports.usage}`;
        const member = interaction?.member ?? message?.member;
        if(member.roles.cache.has(roletoggle.id)) await member.roles.remove(roletoggle.id);
        else await member.roles.add(roletoggle.id);
        return `You toggled your ${roletoggle.name} role.`;
    }
};