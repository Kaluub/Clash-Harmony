const { createProfileCard } = require('../functions.js');
const { readJSON } = require('../json.js');
const { MessageAttachment } = require('discord.js');
const Data = require('../classes/data.js');

module.exports = {
    name: 'profile',
    aliases: ['p'],
    desc: 'This is a command for displaying your profile card.',
    usage: '/profile',
    options: [
        {
            "name": "member",
            "description": "The member who's card to display.",
            "type": "USER",
            "required": false
        }
    ],
    execute: async ({interaction,message}) => {
        let member = message?.mentions.members.first() ?? interaction?.options.getMember("member");
        const self = interaction?.member ?? message?.member;
        const guild = interaction?.guild ?? message?.guild;
        if(!member) member = message?.member ?? interaction?.member;

        const selfdata = await Data.get(guild.id, self.user.id);
        let userdata = await Data.get(guild.id, member.user.id);
        let rewards = await readJSON('json/rewards.json');

        let msg = `${Math.random() < 0.05?'**TIP**: You can customize your profile card using !custom.\n':''}${Math.random() < 0.05?'**TIP**: You can set a profile status using !status.\n':''}${self.user.id == member.user.id ? 'Your' : `${member.user.username}'s`} profile card:`;
        // Luck minigame:
        if(msg.split(/\r\n|\r|\n/).length == 3){
            if(selfdata.unlocked.frames.includes('golden_frame')){
                let luckyPoints = Math.floor(Math.random() * (50 - 20 + 1) + 20);
                if(luckyPoints == 50) msg = `**JACKPOT!** You got the jackpot! You earned **${luckyPoints}** points!\nHere's ${self.user.id == member.user.id ? 'your' : `${member.user.username}'s`} profile card, lucky man:`;
                else msg = `**LUCKY!** You got really lucky! You earned ${luckyPoints} points!\nHere's ${self.user.id == member.user.id ? 'your' : `${member.user.username}'s`} profile card, by the way:`;
                selfdata.points += luckyPoints;
                selfdata.statistics.earned += luckyPoints;
            } else {
                msg = `**LUCKY!** You got lucky! You earned the Golden Frame!\nHere's ${self.user.id == member.user.id ? 'your' : `${member.user.username}'s`} profile card, by the way:`;
                selfdata.unlocked.frames.push('golden_frame');
            };
            await Data.set(guild.id, self.user.id, selfdata);
        };

        const buffer = await createProfileCard(member, rewards, userdata);
        const attachment = new MessageAttachment(buffer,'card.png');
        return {content:msg, files:[attachment]};
    }
};