const {createCanvas, loadImage} = require('canvas');
const {readJSON} = require('../json.js');
const {MessageAttachment} = require('discord.js');
const Keyv = require('keyv');
const Data = require('../data.js');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'profile',
    aliases:['p'],
    admin:false,
    desc:'This is a command for displaying your profile card.',
    usage:'!profile',
    async execute(message,args){
        let member = message.mentions.members.first();
        if(!member) member = message.member;
        let userdata = await userdb.get(`${message.guild.id}/${member.id}`);
        if(!userdata){
            await userdb.set(`${message.guild.id}/${member.id}`, new Data('user',{}));
            userdata = await userdb.get(`${message.guild.id}/${member.id}`);
        };
        let shop = await readJSON('rewards.json');

        let msg = `${Math.random() < 0.05?'**TIP**: You can customize your profile card using !custom.\n':''}${Math.random() < 0.05?'**TIP**: You can set a profile status using !status.\n':''}Your profile card:`;
        // Luck minigame:
        if(msg.split(/\r\n|\r|\n/).length == 3){
            if(userdata.unlocked.frames.includes('golden_frame')){
                let luckyPoints = Math.floor(Math.random() * (50 - 20 + 1) + 20);
                if(luckyPoints == 50) msg = `**JACKPOT!** You got the jackpot! You earned **${luckyPoints}** points!\nHere's your profile card, lucky man:`;
                else msg = `**LUCKY!** You got really lucky! You earned ${luckyPoints} points!\nHere's your profile card, by the way:`;
                userdata.points += luckyPoints;
                userdata.statistics.earned += luckyPoints;
            } else {
                msg = `**LUCKY!** You got lucky! You earned the Golden Frame!\nHere's your profile card, by the way:`;
                userdata.unlocked.frames.push('golden_frame');
            };
            await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
        };

        const canvas = createCanvas(1000,350);
        const ctx = canvas.getContext('2d');

        // Load images:
        const avatar = await loadImage(member.user.displayAvatarURL({format:'png',size:256}));
        const background = await loadImage(`./img/backgrounds/${shop.rewards.backgrounds[userdata.card.background].img}`);
        const frame = await loadImage(`./img/frames/${shop.rewards.frames[userdata.card.frame].img}`);

        let colour = shop.rewards.backgrounds[userdata.card.background].colour;

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
        let badges = await readJSON('badges.json');
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
        ctx.save();
        ctx.beginPath();
        ctx.arc(175, 175, 130, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 47, 47, avatar.width * (256/avatar.width), avatar.height * (256/avatar.height));
        ctx.restore();

        // Draw users pfp border:
        ctx.drawImage(frame, 25, 25);

        const attachment = new MessageAttachment(canvas.toBuffer(),'card.png');
        return message.channel.send(msg, attachment);
    }
};