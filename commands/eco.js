const {economyLog} = require(`../functions.js`);
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'eco',
    aliases:['pointadmin','pa'],
    admin:true,
    desc:'This command is used to manage point distribution.',
    usage:'/eco [@user/user ID] [points]',
    execute: async ({interaction,message,args}) => {
        if(!args[0] || !args[1]) return `Usage: ${module.exports.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let user = message?.mentions.users.first() ?? interaction?.options.getUser('member');
        if(!user){
            try {
                user = await member.client.users.fetch(args[0]);
            } catch {
                return `Usage: ${module.exports.usage}`;
            };
        };
        let points = Number(args[1]);
        if(isNaN(points) || !isFinite(points)) return `Usage: ${module.exports.usage}`;
        let userdata = await userdb.get(`${guild.id}/${user.id}`);
        if(!userdata) return `This user has no data.`;
        if(args.includes('-s')){
            userdata.statistics.earned += points;
            userdata.points = points;
        } else {
            userdata.points += points;
            userdata.statistics.earned += points;
        };
        await userdb.set(`${guild.id}/${user.id}`,userdata);
        economyLog(guild.id, user, null, points, member.user);
        return args.includes('-s') ? `Successfully set ${user.tag} points to ${points}.` : `Successfully added ${points} points to ${user.tag}.`;
    }
};