const { UserData } = require('../classes/data.js');
const Locale = require('../classes/locale.js');
const { randInt } = require('../functions.js');
const { readJSON } = require('../json.js');

module.exports = {
    name: 'daily',
    desc: `Get your daily rewards here.`,
    usage: '/daily',
    execute: async ({interaction,message}) => {
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let userdata = await UserData.get(guild.id, member.user.id);

        const now = new Date(Date.now());
        const nowString = `${now.getUTCDate()}/${now.getUTCMonth() + 1}/${now.getUTCFullYear()}`;
        if(userdata.dailyCooldown == nowString) return Locale.text(userdata.settings.locale, "DAILY_TIMEOUT");
        userdata.dailyCooldown = nowString;
        userdata.addStatistic("dailyUsed");

        const dailyEvents = readJSON("json/daily.json");
        const rewards = readJSON("json/rewards.json");
        let text = Locale.text(userdata.settings.locale, "DAILY_BASE");

        // Golden Background/Jackpot:
        if(Math.random() - userdata.dailyRNGMeter <= 0.01){
            userdata.dailyRNGMeter = 0;
            if(userdata.unlocked.backgrounds.includes('golden_background')){
                userdata.addPoints(10);
                text += Locale.text(userdata.settings.locale, "DAILY_JACKPOT");
            } else {
                userdata.unlocked.backgrounds.push('golden_background');
                text += Locale.text(userdata.settings.locale, "DAILY_GOLD_BACKGROUND");
            };
        } else {
            userdata.dailyRNGMeter += 0.00005 + 0.035 * userdata.dailyRNGMeter;
        };

        if(userdata.statistics.dailyUsed % 100 == 0) { // 100 bonus
            userdata.addPoints(20);
            text += Locale.text(userdata.settings.locale, "DAILY_HUNDRED_BONUS", userdata.statistics.dailyUsed);
        };

        if(now.getUTCDay() == 0) { // Sunday bonus
            userdata.addPoints(1);
            text += Locale.text(userdata.settings.locale, "DAILY_SUNDAY_BONUS");
        };

        for(const event of dailyEvents) {
            if(!nowString.startsWith(event.date)) continue;
            text += Locale.text(userdata.settings.locale, event.name);
            for(const id of event.rewards) {
                const reward = rewards[id];
                if(!reward && !isNaN(id)) {
                    userdata.addPoints(id);
                } else if(reward) {
                    if(userdata.hasReward(reward)) continue;
                    if(reward.type == 'roles') {
                        await member.fetch();
                        if(!member.roles.cache.has(reward.id)) await member.roles.add(reward.id);
                    };
                    userdata.addReward(reward);
                } else { // If nothing else, it is probably a "feature"
                    if(userdata.unlocked.features.includes(id)) continue;
                    userdata.unlocked.features.push(id);
                };
            };
        };

        if(Math.random() <= 0.2) {
            userdata.addPoints(2);
            text += Locale.text(userdata.settings.locale, "DAILY_RANDOM");
        };

        const randomPoints = randInt(2, 4);
        userdata.addPoints(randomPoints);
        text += Locale.text(userdata.settings.locale, "DAILY_NORMAL", randomPoints);

        await UserData.set(guild.id, member.user.id, userdata);
        return text;
    }
};