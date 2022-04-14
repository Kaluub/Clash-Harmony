const { UserData, GuildData } = require('../classes/data.js');
const Locale = require('../classes/locale.js');

module.exports = {
    name: 'fountain',
    desc: `Perhaps you'll get lucky.`,
    usage: '/fountain',
    execute: async ({interaction, message}) => {
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;

        let userdata = await UserData.get(guild.id, member.user.id);

        if(userdata.points < 0) return Locale.text(userdata.settings.locale, "FOUNTAIN_NO_POINTS");
        userdata.addPoints(-1);
        userdata.addStatistic("AfountainSpent");

        let guilddata = await GuildData.get(guild.id);
        guilddata.fountain.amountSpent += 1;

        let text = Locale.text(userdata.settings.locale, "FOUNTAIN_SUMMARY");

        let random = Math.random();
        let points = 0;

        if(userdata.unlocked.features.includes("FOUNTAIN_RNG")) random += 0.01;
        if(userdata.unlocked.features.includes("FOUNTAIN_RNG_MEGA")) random += 0.5;

        // Reward for being super lucky
        if(random > 0.9999 && !userdata.unlocked.features.includes("FOUNTAIN_RNG")) {
            userdata.unlocked.features.push("FOUNTAIN_RNG");
            text += Locale.text(userdata.settings.locale, "FOUNTAIN_BIG_REWARD");
        };

        if(random > 0.9999) points = 1000;
        else if(random > 0.999) points = 100;
        else if(random > 0.97) points = 5;
        else if(random > 0.85) points = 2;
        else if(random > 0.7) points = 1;

        if(points) {
            userdata.addPoints(points);
            userdata.addStatistic("fountainGained", points);
            guilddata.fountain.amountGained += points;
            text += Locale.text(userdata.settings.locale, "FOUNTAIN_REWARD", points);
        } else {
            text += Locale.text(userdata.settings.locale, "FOUNTAIN_NO_REWARD");
        }

        await GuildData.set(guild.id, guilddata);
        await UserData.set(guild.id, member.id, userdata);
        return text;
    }
};