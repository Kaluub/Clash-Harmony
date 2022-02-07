const { UserData } = require('../classes/data.js');
const Locale = require('../classes/locale.js');

module.exports = {
    name: 'monthly',
    aliases: ['m'],
    desc: `This is a command for earning your monthly rewards.`,
    usage: '/monthly',
    execute: async ({interaction, message}) => {
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let userdata = await UserData.get(guild.id, member.user.id);

        if(userdata.monthlyCooldown > Date.now()){
            let timeRemaining = userdata.monthlyCooldown - Date.now();
            let totalSeconds = (timeRemaining / 1000);
            let days = Math.floor(totalSeconds / 86400);
            totalSeconds %= 86400;
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            return Locale.text(userdata.settings.locale, "MONTHLY_COOLDOWN", days, hours, minutes);
        };

        userdata.monthlyCooldown = Date.now() + 2592000000;
        if(userdata.unlocked.features.includes('MONTHLY_COOLDOWN_10')) userdata.monthlyCooldown -= 259200000;
        if(userdata.unlocked.features.includes('DEBUG')) userdata.monthlyCooldown = 1;

        let earnedPoints = 20;
        let msg = Locale.text(userdata.settings.locale, "MONTHLY_DEFAULT");

        if(member.roles.cache.has('636987578125647923') || member.roles.cache.has('813870575453077504')){
            earnedPoints += 20;
            msg += Locale.text(userdata.settings.locale, "MONTHLY_CLAN_MEMBERSHIP");
        };

        if(member.roles.cache.has('679411730748669953')){
            earnedPoints += 50;
            msg += Locale.text(userdata.settings.locale, "MONTHLY_NITRO");
        };

        if(Math.random() > 0.4){
            let bonusPoints = Math.floor(Math.random() * 15 + 1);
            earnedPoints += bonusPoints;
            msg += Locale.text(userdata.settings.locale, "MONTHLY_RANDOM", bonusPoints);
        };

        if(userdata.unlocked.features.includes('MONTHLY_20')){
            let bonusPoints = Math.floor(0.2 * earnedPoints);
            earnedPoints *= 1.2;
            msg += Locale.text(userdata.settings.locale, "MONTHLY_BOOST", bonusPoints);
        };

        msg += Locale.text(userdata.settings.locale, "MONTHLY_CONCLUSION", Math.floor(earnedPoints));
        userdata.points += Math.floor(earnedPoints);
        userdata.statistics.earned += earnedPoints;
        await UserData.set(guild.id, member.user.id, userdata);
        return msg;
    }
};