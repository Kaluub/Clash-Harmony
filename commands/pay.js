const Keyv = require('keyv');
const Data = require('../classes/data.js');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});
const functions = require(`../functions.js`);

module.exports = {
    name:'pay',
    aliases:['give','send'],
    desc:'This command is used to circulate points between users.',
    usage:'!pay [points] [@user/user name]',
    async execute({interaction,message,args}){
        if(!args[0] || !args[1]) return `Usage: ${this.usage}`;
        let count = message ? parseInt(args[0]) : interaction?.options[1].value;
        if(isNaN(count) || count < 1) return `You need to provide a valid number!`;
        args.shift();
        let member = message?.mentions.members.first() ?? interaction?.options[0].member;
        if(!member) member = await message?.guild.members.fetch({query:args.join(' '), limit:1}).then(col => col.first());
        if(!member) return `Please provide a valid @user mention or username.`;
        if(member.user.bot) return `You can't give your points to a bot.`;
        const self = interaction?.member ?? message?.member;
        const guild = interaction?.guild ?? message?.guild;
        if(self.user.id == member.user.id) return `You can't give yourself points.`
        let userdata = await userdb.get(`${guild.id}/${self.user.id}`);
        if(Date.now() - userdata.statistics.age < 1210000000) return 'You need to wait at least 2 weeks between your first interaction with this bot and now in order to send points.';
        if(userdata.points < count) return `You don't have enough points! You would need ${count - userdata.points} more points to confirm this transaction.`;
        let userdata2 = await userdb.get(`${guild.id}/${member.user.id}`);
        if(!userdata2) return 'This user has no data! They need to send a simple message and this issue will be fixed.';
        if(userdata == userdata2){
            console.log(`Duplicated userdata found at [${guild.id}/${self.user.id}] and [${guild.id}/${member.user.id}].`);
            functions.resetLog(guild.id,self.user.id,member.user.id,userdata,userdata2);
            await userdb.set(`${guild.id}/${self.user.id}`, new Data('user',{}));
            await userdb.set(`${guild.id}/${member.user.id}`, new Data('user',{}));
            return `You and the user you are paying have duplicated data. This has been logged & will be investigated later. For the time being, your data will be backed up and reset to avoid any more issues.`;
        }
        userdata.points -= count;
        userdata2.points += count;
        await userdb.set(`${guild.id}/${self.user.id}`, userdata);
        await userdb.set(`${guild.id}/${member.user.id}`, userdata2);
        return `You gave ${count} points to ${member.user.username} (${userdata.points} points left).`;
    }
};