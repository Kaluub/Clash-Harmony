const Keyv = require('keyv');
const Data = require('../data');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'monthly',
    aliases:['mr'],
    admin:false,
    desc:`This is a command for earning your monthly rewards.`,
    usage:'!monthly',
    async execute(message,args){
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        if(!userdata) return message.channel.send('Database error occured.');
        if(userdata.monthlyCooldown > Date.now()){
            let timeRemaining = userdata.monthlyCooldown - Date.now();
            let totalSeconds = (timeRemaining / 1000);
            let days = Math.floor(totalSeconds / 86400);
            totalSeconds %= 86400;
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            return message.channel.send(`You can't claim your monthly bonus for another ${days}d ${hours}h ${minutes}m.`);
        };
        userdata.monthlyCooldown = Date.now() + 2592000000;
        let earnedPoints = 10;
        let msg = `Your monthly reward:\n • **10** base points`
        if(message.member.roles.cache.has('636987578125647923') || message.member.roles.cache.has('813870575453077504')){
            earnedPoints += 10;
            msg += `\n • **+10** points for being in the clan`;
        };
        if(message.member.roles.cache.has('679411730748669953')){
            earnedPoints += 50;
            msg += `\n • **+50** points for being a Nitro Booster`;
        };
        if(Math.random() > 0.9){
            let bonusPoints = Math.floor(Math.random() * (10 - 1 + 1) + 1);
            earnedPoints += bonusPoints;
            msg += `\n • **+${bonusPoints}** bonus random points`;
        };
        msg += `\n\nIn total, you earned ${earnedPoints} points. You can use this command again next month!`;
        userdata.points += earnedPoints;
        userdata.statistics.earned += earnedPoints;
        await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
        return message.channel.send(msg);
    }
};