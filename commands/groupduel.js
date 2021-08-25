const {createCanvas, loadImage} = require('canvas');
const {readJSON} = require('../json.js');
const { randInt } = require('../functions.js')
const {MessageAttachment, MessageEmbed, MessageActionRow, MessageButton, Collection} = require('discord.js');



async function updateDuel(battle, {canvas, ctx, duels}, channel, {backgroundImage, healthImage, healthMissingImage, critImage}){
    // Duel logic:
    battle.round += 1;
    let logText = '';

    const alivePlayers = await battle.players.filter(p => p.hp > 0);
    const randomChance = randInt(0, 100);

    let attacker = await alivePlayers.random();
    let defender = await alivePlayers.filter(p => p.id != attacker.id).random();
    if(alivePlayers.size < 2) logText = `WINNER! ${alivePlayers.first().username} won!`;
    else {
        if(randomChance > 85) {
            defender.hp -= 15;
            logText = `CRIT! ${duels.critText[randInt(0, duels.critText.length - 1)].replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username)}`;
        } else if (randomChance > 75){
            logText = `MISS! ${duels.missText[randInt(0, duels.missText.length - 1)].replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username)}`;
        } else {
            defender.hp -= 10;
            logText = duels.defaultText[randInt(0, duels.defaultText.length - 1)].replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username);
        };
        if(defender.hp < 1) logText = `KILL! ${duels.killText[randInt(0, duels.killText.length - 1)].replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username)}`;
    };


    battle.log.push(logText);

    // Draw first things:
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0);

    for(const [id, member] of battle.players){
        // Initial checks & values:
        if(member.hp <= 0) continue;
        const x = randInt(200, 800);
        const y = randInt(125, 250);

        // Draw avatar:
        ctx.save(); ctx.beginPath();
        ctx.arc(x + 64, y + 64, 64, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(member.image, x, y, member.image.width * (128/member.image.width), member.image.height * (128/member.image.height));
        ctx.restore();

        // Draw effects (if any):
        if(defender?.id == member.id && randomChance > 85) ctx.drawImage(critImage, x, y);

        // Draw name:
        ctx.textAlign = "center";
        ctx.font = '32px "Noto Sans"';
        ctx.fillStyle =
            member.id == attacker.id ? '#DD5577':
            member.id == defender.id ? '#5555EE':
            '#000000';
        ctx.fillText(member.username, x + 64, y - 32, 150);


        // Draw HP:
        ctx.fillStyle = '#080808';
        ctx.fillRect(x - 23, y - 22, 154, 16);

        ctx.fillStyle = ctx.createPattern(healthMissingImage, "repeat");
        ctx.fillRect(x - 21, y - 20, 150, 12);

        const hp = Math.floor(member.hp / member.maxHp * 150);
        ctx.fillStyle = ctx.createPattern(healthImage, "repeat");
        ctx.fillRect(x - 21, y - 20, hp, 12);
    };

    // Draw battle log:
    ctx.font = '40px "Noto Sans"';
    ctx.fillStyle = '#000000';
    ctx.fillText(battle.log[battle.log.length - 1], 500, 50, 950);

    // Return embed:
    const attachment = new MessageAttachment(canvas.toBuffer(), 'duel.png');
    const embed = new MessageEmbed()
        .setTitle(`Group duel!`)
        .setDescription(`A group duel!\nRound: ${battle.round}.\nRound detail: ${battle.log[battle.log.length - 1]}`)
        .setImage(`attachment://duel.png`)
        .setColor(`#33AA33`)
        .setTimestamp();
    const msg = await channel.send({embeds:[embed], files:[attachment]});

    // Queue next update:
    if(alivePlayers.size > 1) setTimeout(async () => {
        await updateDuel(...arguments).then();
        await msg.delete();
    }, 1500);
};

module.exports = {
    name:'groupduel',
    aliases:['gd', 'duelmega'],
    desc:'This is a command for dueling other users.',
    usage:'/groupduel [stats/@user(s))]',
    admin: true,
    execute: async ({interaction, message}) => {
        const self = interaction?.member ?? message?.member;
        const members = message?.mentions.members;
        members.set(self.id, self);

        if(members.size < 2) return ``

        let battle = {
            round: 0,
            amount: 0,
            log: ['Battle started!'],
            background: 'default_background',
            players: new Collection()
        };

        // Get duel data:
        const duels = await readJSON(`json/duels.json`);

        // Load images:
        const backgroundImage = await loadImage(`./img/duels/backgrounds/${duels.backgrounds[battle.background].img}`);
        const healthImage = await loadImage(`./img/duels/health.png`);
        const healthMissingImage = await loadImage(`./img/duels/health_missing.png`);
        const critImage = await loadImage(`./img/duels/crit.png`);
        
        const canvas = createCanvas(1000, 600);
        const ctx = canvas.getContext('2d');

        // Draw first things:
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0);

        for(const [snowflake, member] of members){
            // Load member avatar:
            const image = await loadImage(member.user.displayAvatarURL({format:'png',size:128}));

            // Set variables:
            battle.players.set(member.id, {
                id: member.id,
                username: member.user.username,
                image: image,
                hp: 100,
                maxHp: 100
            });

            const x = randInt(200, 800);
            const y = randInt(150, 250);
    
            // Draw avatar:
            ctx.save(); ctx.beginPath();
            ctx.arc(x + 64, y + 64, 64, 0, Math.PI * 2);
            ctx.closePath(); ctx.clip();
            ctx.drawImage(image, x, y, image.width * (128/image.width), image.height * (128/image.height));
            ctx.restore();
    
            // Draw name:
            ctx.textAlign = "center";
            ctx.font = '32px "Noto Sans"';
            ctx.fillText(member.user.username, x + 64, y - 32, 150);
        };

        // Draw VS:
        ctx.textAlign = "center";
        ctx.font = '86px "Noto Sans"';
        ctx.fillText(`DUEL VS.`, 500, 100, 500);

        const attachment = new MessageAttachment(canvas.toBuffer(), 'startduel.png');
        const embed = new MessageEmbed()
            .setTitle(`Request to duel!`)
            .setDescription(`Press the '✅' button to start the duel!${battle.amount !== 0 ? `\nPrice: ${battle.amount} points.` : ''}`)
            .setImage('attachment://startduel.png')
            .setFooter(`This request expires at:`)
            .setTimestamp(Date.now() + 60000)
            .setColor(`#33AA33`);

        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setEmoji('✅')
                .setStyle('SUCCESS')
                .setCustomId('start')
        );
        
        let msg = await message?.channel.send({embeds: [embed], files:[attachment], components: [row]});
        if(!msg){
            await interaction?.reply({content:`Ping: ${member.user}`, embeds:[embed], files:[attachment], components: [row]});
            msg = await interaction?.fetchReply();
        };
        const collector = msg.createMessageComponentCollector({filter: int => members.has(int.user.id), time: 60000});
        collector.on('collect', async int => {
            updateDuel(battle, {canvas, ctx, duels}, msg.channel, {backgroundImage, healthImage, healthMissingImage, critImage});
            msg.delete();
        });
        collector.on('end', (collected, reason) => {
            if(reason == 'time' && !msg.deleted) msg.delete();
        });
    }
};