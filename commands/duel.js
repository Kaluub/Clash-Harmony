const {createCanvas, loadImage} = require('canvas');
const {readJSON} = require('../json.js');
const {MessageAttachment, MessageEmbed} = require('discord.js');
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});
const GIFEncoder = require('gif-encoder-2');

async function updateDuel(battle, {canvas, ctx, encoder}, channel, {self, selfdata}, {member, userdata}){
    // Get duel data:
    const duels = await readJSON(`json/duels.json`);

    // Update duel logic:
    if(battle[0].round == 0){
        battle[0].round += 1;
    } else {
        battle[0].round += 1;
        if(battle[0].round % 2 != 0){ // Player 1:
            let damage = 10;
            let random = Math.random();
            if(random > 0.7) damage += 5; // CRIT!
            else if(random < 0.15) damage = 0; // MISS!
            battle[0].log.push(`${damage == 10 ? '' : damage == 0 ? 'MISS! ': 'CRIT! '}${self.user.username} deals ${damage} damage!`);
            battle[2].hp -= damage;
        } else { // Player 2:
            let damage = 10;
            let random = Math.random();
            if(random > 0.7) damage += 5; // CRIT!
            else if(random < 0.15) damage = 0; // MISS!
            battle[0].log.push(`${damage == 10 ? '' : damage == 0 ? 'MISS! ': 'CRIT! '}${member.user.username} deals ${damage} damage!`);
            battle[1].hp -= damage;
        };
        if(battle[1].hp < 1){ // Player 1 lost:
            battle[0].log.push(`Battle over! ${member.user.username} won${battle[0].amount !== 0 ? ` ${battle[0].amount} points` : ''}!`);
        };
        if(battle[2].hp < 1){ // Player 2 lost:
            battle[0].log.push(`Battle over! ${self.user.username} won${battle[0].amount !== 0 ? ` ${battle[0].amount} points` : ''}!`);
        };
    };
    
    // Load needed images:
    const backgroundImage = await loadImage(`./img/duels/backgrounds/${duels.backgrounds[selfdata.duels.background].img}`);
    const selfImage = await loadImage(self.user.displayAvatarURL({format:'png',size:128}));
    const memberImage = await loadImage(member.user.displayAvatarURL({format:'png',size:128}));
    const healthImage = await loadImage(`./img/duels/health.png`);
    const healthMissingImage = await loadImage(`./img/duels/health_missing.png`);

    // Draw first things:
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0);

    // Draw avatars:
    ctx.save(); ctx.beginPath();
    ctx.arc(164, 300, 64, 0, Math.PI * 2);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(selfImage, 100, 236);
    ctx.restore(); ctx.save(); ctx.beginPath();
    ctx.arc(836, 300, 64, 0, Math.PI * 2);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(memberImage, 772, 236);
    ctx.restore();

    // Draw names:
    ctx.textAlign = "center";
    ctx.font = '32px "Noto Sans"';
    ctx.fillStyle = battle[0].round % 2 != 0 ? '#FF0000' : '#000000';
    ctx.fillText(self.user.username, 164, 202, 150);
    ctx.fillStyle = battle[0].round % 2 == 0 ? '#FF0000' : '#000000';
    ctx.fillText(member.user.username, 836, 202, 150);

    // Draw battle log:
    ctx.font = '40px "Noto Sans"';
    ctx.fillStyle = '#000000';
    ctx.fillText(battle[0].log[battle[0].log.length - 1], 500, 100, 750);

    // Draw HP:
    ctx.fillStyle = '#080808';
    ctx.fillRect(87, 212, 154, 16);
    ctx.fillRect(759, 212, 154, 16);

    ctx.fillStyle = ctx.createPattern(healthMissingImage, "repeat");
    ctx.fillRect(89, 214, 150, 12);
    ctx.fillRect(761, 214, 150, 12);

    ctx.fillStyle = ctx.createPattern(healthImage, "repeat");

    let hp1 = Math.floor(battle[1].hp / battle[1].maxHp * 150);
    if(hp1 < 1) hp1 = 0;
    ctx.fillRect(89, 214, hp1, 12)

    let hp2 = Math.floor(battle[2].hp / battle[2].maxHp * 150);
    if(hp2 < 1) hp2 = 0;
    ctx.fillRect(761, 214, hp2, 12)

    // Return embed:
    if(encoder) encoder.addFrame(ctx);
    const attachment = new MessageAttachment(canvas.toBuffer(),'duel.png');
    const embed = new MessageEmbed()
        .setTitle(`Duel!`)
        .setDescription(`Duel between ${self.user.username} and ${member.user.username}!\nRound: ${battle[0].round}.\nRound detail: ${battle[0].log[battle[0].log.length - 1]}`)
        .attachFiles([attachment])
        .setImage(`attachment://duel.png`)
        .setColor(battle[1].hp < 1 || battle[2].hp < 1 ? `#33AA33` : `#AA3333`)
        .setTimestamp();
    const msg = await channel.send(embed);

    // Queue next update:
    if(battle[1].hp < 1 || battle[2].hp < 1){
        if(battle[0].amount != 0){
            if(battle[1].hp < 1){
                selfdata.points -= battle[0].amount;
                userdata.points += battle[0].amount;
            } else {
                selfdata.points += battle[0].amount;
                userdata.points -= battle[0].amount;
            };
        };
        if(battle[1].hp < 1){
            userdata.statistics.duelsWon += 1;
            selfdata.statistics.duelsLost += 1;
        } else {
            selfdata.statistics.duelsWon += 1;
            userdata.statistics.duelsLost += 1;
        };
        await userdb.set(`${self.guild.id}/${self.user.id}`, selfdata);
        await userdb.set(`${member.guild.id}/${member.user.id}`, userdata);
        if(encoder){
            encoder.finish();
            const replay = new MessageAttachment(encoder.out.getData(), 'duel.gif');
            await channel.send({content:"Replay of your duel:", files:[replay]});
        };
    } else {
        msg.client.setTimeout(async () => {
            await updateDuel(battle, {canvas:canvas, ctx:ctx, encoder:encoder}, channel, {self:self, selfdata:selfdata}, {member:member, userdata:userdata}).then();
            await msg.delete();
        }, 1500);
    };
};

module.exports = {
    name:'duel',
    aliases:['d'],
    desc:'This is a command for dueling other users.',
    usage:'!duel [stats/@user] [amount]',
    async execute({interaction,message,args}){
        const guild = interaction?.guild ?? message?.guild;
        const self = interaction?.member ?? message?.member;
        const member = interaction?.options[0].member ?? message?.mentions.members.first();
        if(!member) {
            if(args[0] == 'stats'){
                const selfdata = await userdb.get(`${guild.id}/${self.user.id}`);
                const embed = new MessageEmbed()
                    .setColor('#7777AA')
                    .setTitle('Your duel stats:')
                    .setDescription(`Duels won: ${selfdata.statistics.duelsWon}\nDuels lost: ${selfdata.statistics.duelsLost}`)
                    .setTimestamp()
                return embed;
            };
            return `Usage: ${this.usage}`;
        }
        if(self.user.id == member.user.id) return `You can't battle yourself.`;
        const selfdata = await userdb.get(`${guild.id}/${self.user.id}`);
        const userdata = await userdb.get(`${guild.id}/${member.user.id}`);
        let amount = 0;
        if(args[1]){
            amount = parseInt(args[1]);
            if(isNaN(amount)) return `Your amount should be a valid number!`;
            if(selfdata.points < amount) return `You can't afford this duel!`;
            if(userdata.points < amount) return `Your opponent can't afford this duel!`;
        };

        const canvas = createCanvas(1000,600);
        const ctx = canvas.getContext('2d');
        let encoder;
        if(amount > 0){
            encoder = new GIFEncoder(1000,600,'neuquant');
            encoder.setDelay(1000);
            encoder.start();
        };

        // Load needed images:
        const duels = await readJSON(`json/duels.json`);
        const backgroundImage = await loadImage(`./img/duels/backgrounds/${duels.backgrounds[selfdata.duels.background].img}`);
        const selfImage = await loadImage(self.user.displayAvatarURL({format:'png',size:128}));
        const memberImage = await loadImage(member.user.displayAvatarURL({format:'png',size:128}));

        // Draw first things:
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0);


        // Draw avatars:
        ctx.save(); ctx.beginPath();
        ctx.arc(164, 300, 64, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(selfImage, 100, 236);
        ctx.restore(); ctx.save(); ctx.beginPath();
        ctx.arc(836, 300, 64, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(memberImage, 772, 236);
        ctx.restore();

        // Draw names:
        ctx.textAlign = "center";
        ctx.font = '32px "Noto Sans"';
        ctx.fillStyle = '#000000';
        ctx.fillText(self.user.username, 164, 202, 150);
        ctx.fillText(member.user.username, 836, 202, 150);

        // Draw VS:
        ctx.font = '86px "Noto Sans"';
        ctx.fillText(`DUEL VS.`, 500, 200, 500);

        if(encoder) encoder.addFrame(ctx);
        const attachment = new MessageAttachment(canvas.toBuffer(), 'startduel.png');
        const embed = new MessageEmbed()
            .setTitle(`Request to duel!`)
            .setDescription(`React with '✅' to start the duel with ${self.user.username}!${amount !== 0 ? `\nPrice: ${amount} points.` : ''}`)
            .attachFiles([attachment])
            .setImage('attachment://startduel.png')
            .setFooter(`This request expires at:`)
            .setTimestamp(Date.now() + 60000)
            .setColor(`#33AA33`);
        let msg = await message?.channel.send({content:`Ping: ${member.user}`, embed:embed});
        if(!msg){
            await interaction?.reply({content:`Ping: ${member.user}`, embeds:[embed]});
            msg = await interaction?.fetchReply();
        };
        await msg.react('✅');
        const collector = msg.createReactionCollector((reaction, user) => reaction.emoji.name == '✅', {time:60000});
        collector.on('collect', async (reaction, user) => {
            if(user.id !== member.id) return reaction.users.remove(user.id);
            let battle = [
                {
                    round: 0,
                    amount: amount,
                    log: ['Battle started!']
                },
                {
                    maxHp: 100,
                    hp: 100
                },
                {
                    maxHp: 100,
                    hp: 100
                }
            ]
            updateDuel(battle, {canvas:canvas, ctx:ctx, encoder:encoder}, msg.channel, {self:self, selfdata:selfdata}, {member:member, userdata:userdata});
            msg.delete();
        });
        collector.on('end', (collected, reason) => {
            if(reason == 'time' && !msg.deleted) msg.delete();
        });
    }
};