const { createProfileCard } = require('../functions.js');
const { readJSON } = require('../json.js');
const { MessageAttachment } = require('discord.js');
const { UserData } = require('../classes/data.js');
const Locale = require('../classes/locale.js');

module.exports = {
    name: 'profile',
    aliases: ['p'],
    desc: 'This is a command for displaying your profile card.',
    usage: '/profile',
    options: [
        {
            "name": "member",
            "description": "The member whos card to display.",
            "type": "USER",
            "required": false
        }
    ],
    execute: async ({interaction,message}) => {
        let member = message?.mentions.members.first() ?? interaction?.options.getMember("member");
        const self = interaction?.member ?? message?.member;
        const guild = interaction?.guild ?? message?.guild;
        if(!member) member = message?.member ?? interaction?.member;

        const selfdata = await UserData.get(guild.id, self.user.id);
        let userdata = await UserData.get(guild.id, member.user.id);
        let rewards = await readJSON('json/rewards.json');

        let msg = `${Math.random() < 0.05 ? Locale.text(selfdata.settings.locale, "PROFILE_TIPS") : ''}${Locale.text(selfdata.settings.locale, "PROFILE_CARD")}`;
        // Luck minigame:
        if(Math.random < 0.005){
            if(selfdata.unlocked.frames.includes('golden_frame')){
                let luckyPoints = Math.floor(Math.random() * (50 - 20 + 1) + 20);
                if(luckyPoints == 50) msg = Locale.text(selfdata.settings.locale, "PROFILE_JACKPOT", luckyPoints);
                else msg = Locale.text(selfdata.settings.locale, "PROFILE_LUCKY", luckyPoints);
                selfdata.points += luckyPoints;
                selfdata.statistics.earned += luckyPoints;
            } else {
                msg = Locale.text(selfdata.settings.locale, "PROFILE_GOLDEN_FRAME");
                selfdata.unlocked.frames.push('golden_frame');
            };
            await UserData.set(guild.id, self.user.id, selfdata);
        };

        const buffer = await createProfileCard(member, rewards, userdata);
        const attachment = new MessageAttachment(buffer,'card.png');
        return {content:msg, files:[attachment]};
    }
};