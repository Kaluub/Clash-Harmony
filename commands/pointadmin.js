const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'pointadmin',
    aliases:['eco','pa'],
    admin:true,
    desc:'This command is used to manage point distribution.',
    usage:'!eco [@user/user ID] [points]',
    async execute(message,args){
        if(!args[0] || !args[1]) return message.channel.send('Usage: ' + this.usage);
        let user = message.mentions.users.first();
        if(!user){
            try {
                user = await message.client.users.fetch(args[0]);
            } catch {
                return message.channel.send('Usage: ' + this.usage);
            };
        };
        let points = Number(args[1]);
        if(isNaN(points) || !isFinite(points)) return message.channel.send('Usage: ' + this.usage);
        let userdata = await userdb.get(`${message.guild.id}/${user.id}`);
        if(args.includes('-s')){
            userdata.statistics.earned += points;
            userdata.points = points;
        } else {
            userdata.points += points;
            userdata.statistics.earned += points;
        };
        await userdb.set(`${message.guild.id}/${user.id}`,userdata);
        return message.channel.send(args.includes('-s') ? `Successfully set ${user.tag} points to ${points}.` : `Successfully added ${points} points to ${user.tag}.`);
    }
};