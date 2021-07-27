const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'pay',
    aliases:['give','send'],
    admin:false,
    desc:'This command is used to circulate points between users.',
    usage:'!pay [points] [@user/user name]',
    async execute(message,args){
        if(!args[0] || !args[1]) return message.channel.send('Usage: ' + this.usage);
        let member = message.mentions.members.first();
        let count = parseInt(args[0]);
        if(isNaN(count) || count < 1) return message.channel.send(`You need to provide a valid number!`);
        args.shift();
        if(!member) member = await message.guild.members.fetch({query:args.join(' '), limit:1}).then(col => col.first());
        if(!member) return message.channel.send(`Please provide a valid @user mention or username.`);
        if(member.user.bot) return message.channel.send(`You can't give your points to a bot.`);
        if(message.author.id == member.user.id) return message.channel.send(`You can't give points to yourself.`);
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        if(Date.now() - userdata.statistics.age < 1210000000) return message.channel.send('You need to wait at least 2 weeks between your first interaction with this bot and now in order to send points.');
        if(userdata.points < count) return message.channel.send(`You don't have enough points! You would need ${count - userdata.points} more points to confirm this transaction.`);
        let userdata2 = await userdb.get(`${message.guild.id}/${member.user.id}`);
        if(!userdata2) return message.channel.send('This user has no data! They need to send a simple message and this issue will be fixed.');
        userdata.points -= count;
        userdata2.points += count;
        await userdb.set(`${message.guild.id}/${message.author.id}`, userdata);
        await userdb.set(`${message.guild.id}/${member.user.id}`, userdata2);
        return message.channel.send(`You gave ${count} points to ${member.user.username} (${userdata.points} points left).`);
    }
};