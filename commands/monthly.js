const {economyLog} = require(`../functions.js`);
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'monthly',
    aliases:['m'],
    desc:`This is a command for earning your monthly rewards.`,
    usage:'!monthly',
    execute: async ({interaction,message}) => {
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let userdata = await userdb.get(`${guild.id}/${member.user.id}`);
        if(!userdata) return 'Database error occured.';
        if(userdata.monthlyCooldown > Date.now()){
            let timeRemaining = userdata.monthlyCooldown - Date.now();
            let totalSeconds = (timeRemaining / 1000);
            let days = Math.floor(totalSeconds / 86400);
            totalSeconds %= 86400;
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            return `You can't claim your monthly bonus for another ${days}d ${hours}h ${minutes}m.\n\nWhen you claim your monthly bonus, there are a few things that influence the output:\nYou always will get 10 free points.\nHarmony & Clash Members get +10 points added on.\nNitro Boosters to this server get +50 points added on.\nYou also can get up to 10 random free points.`;
        };
        userdata.monthlyCooldown = Date.now() + 2592000000;
        if(userdata.unlocked.features.includes('MONTHLY_COOLDOWN_10')) userdata.monthlyCooldown -= 259200000;
        if(userdata.unlocked.features.includes('DEBUG')) userdata.monthlyCooldown = 1;
        let earnedPoints = 10;
        let msg = `Your monthly reward:\n • **10** base points`
        if(member.roles.cache.has('636987578125647923') || member.roles.cache.has('813870575453077504')){
            earnedPoints += 10;
            msg += `\n • **+10** points for being in the clan`;
        };
        if(member.roles.cache.has('679411730748669953')){
            earnedPoints += 50;
            msg += `\n • **+50** points for being a Nitro Booster`;
        };
        if(Math.random() > 0.4){
            let bonusPoints = Math.floor(Math.random() * (10 - 1 + 1) + 1);
            earnedPoints += bonusPoints;
            msg += `\n • **+${bonusPoints}** bonus random points`;
        };
        if(userdata.unlocked.features.includes('MONTHLY_20')){
            let bonusPoints = Math.floor(0.2 * earnedPoints);
            earnedPoints *= 1.2;
            msg += `\n • **+${bonusPoints}** monthly 20% boost`;
        };
        msg += `\n\nIn total, you earned ${Math.floor(earnedPoints)} points. You can use this command again next month!`;
        userdata.points += Math.floor(earnedPoints);
        userdata.statistics.earned += earnedPoints;
        await userdb.set(`${guild.id}/${member.user.id}`,userdata);
        economyLog(guild.id, member.user, null, earnedPoints);
        return msg;
    }
};