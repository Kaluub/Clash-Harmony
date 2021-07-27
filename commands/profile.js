const {createCanvas, loadImage} = require('canvas');
const {readJSON} = require('../json.js');
const {MessageAttachment} = require('discord.js');
const Keyv = require('keyv');
const Data = require('../classes/data.js');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'profile',
    aliases:['p'],
    desc:'This is a command for displaying your profile card.',
    usage:'!profile',
    execute: async ({interaction,message}) => {
        let member = message?.mentions.members.first() ?? interaction?.options.first()?.member;
        const self = interaction?.member ?? message?.member;
        const guild = interaction?.guild ?? message?.guild;
        if(!member) member = message?.member ?? interaction?.member;
        const selfdata = await userdb.get(`${guild.id}/${self.user.id}`);
        let userdata = new Data(await userdb.get(`${guild.id}/${member.user.id}`));
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
            await userdb.set(`${guild.id}/${self.user.id}`,selfdata);
        };

        const canvas = createCanvas(1000,350);
        const ctx = canvas.getContext('2d');

        // Load images:
        const avatar = await loadImage(member.user.displayAvatarURL({format:'png',size:256}));
        const background = await loadImage(`./img/backgrounds/${rewards[userdata.card.background].img}`);
        const frame = await loadImage(`./img/frames/${rewards[userdata.card.frame].img}`);

        let colour = rewards[userdata.card.background].colour;

        ctx.drawImage(background, 0, 0);

        ctx.font = 'bold 40px "Noto Sans"';
        ctx.fillStyle = member.displayHexColor == '#000000' ? '#FFFFFF' : member.displayHexColor;
        ctx.fillText(`${member.user.tag}`, 336, 42, 636);
        ctx.fillStyle = '#000000';
        ctx.strokeText(`${member.user.tag}`, 336, 42, 636);

        ctx.fillStyle = '#505050BB';
        ctx.fillRect(336, 58, 640, 44); // Status
        ctx.fillRect(336, 108, 318, 44); // Points
        ctx.fillRect(658, 108, 318, 44); // Total earned
        ctx.fillRect(336, 158, 552, 140); // Badges
        
        ctx.font = '32px "Noto Sans"';
        ctx.fillStyle = colour;
        ctx.fillText(`Points: ${userdata.points}`, 344, 140, 310);
        ctx.fillText(`Total earned: ${userdata.statistics.earned}`, 666, 140, 310);

        if(userdata.status.length > 0) ctx.fillText(`${userdata.status}`, 344, 90, 636);
        else ctx.fillText(`No custom status.`, 344, 90, 636);

        // Badges:
        let badges = await readJSON('json/badges.json');
        let bx = 0, by = 0;
        for(const i in badges.badges){
            let badge = badges.badges[i];
            let renderBadge = await member.roles.cache.some(role => badge.roles.includes(role.id));
            if(renderBadge){
                let badgeImage = await loadImage(`./img/badges/${badge.img}`);
                ctx.drawImage(badgeImage, 340 + bx, 162 + by);
                bx += 68;
                if(bx >= 544) bx = 0, by += 68;
            };
        };

        // Cut pfp to circle:
        ctx.save(); ctx.beginPath();
        ctx.arc(175, 175, 128, 0, Math.PI * 2, true);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(avatar, 47, 47, avatar.width * (256/avatar.width), avatar.height * (256/avatar.height));
        ctx.restore();

        // Draw users pfp border:
        ctx.drawImage(frame, 25, 25);

        const attachment = new MessageAttachment(canvas.toBuffer(),'card.png');
        return {content:msg, files:[attachment]};
    }
};