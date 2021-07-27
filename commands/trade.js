const {MessageEmbed, MessageButton, MessageActionRow} = require("discord.js");
const {readJSON} = require('../json.js');
const Data = require('../classes/data.js');

async function startTrade({member, partner, channel}){
    Data.lockIds([member.user.id, partner.user.id]);
    const rewards = readJSON('json/rewards.json');
    let trade = {};
    trade[member.user.id] = {
        points: 0,
        items: [],
        confirmed: false
    };
    trade[partner.user.id] = {
        points: 0,
        items: [],
        confirmed: false
    };
    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId('add-item')
            .setLabel('Add Item')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('remove-item')
            .setLabel('Remove Item')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('set-points')
            .setLabel('Set Points')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('confirm-trade')
            .setLabel('Confirm')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('cancel-trade')
            .setLabel('Cancel')
            .setStyle('DANGER')
    );
    const embed = new MessageEmbed()
        .setTitle(`Trade Interface`)
        .setColor(`#AA3322`)
        .setTimestamp()
        .setDescription(`Trade between **${member.user.tag}** and **${partner.user.tag}**:\n\n⛔ | **${member.user.tag}**'s offer:\nNo items!\n\n⛔ | **${partner.user.tag}**'s offer:\nNo items!`);
    const message = await channel.send({embeds:[embed], components:[row]});
    const collector = message.createMessageComponentCollector({filter: int => int.isButton() && int.user.id == member.user.id || int.user.id == partner.user.id, idle:60000});
    collector.on('collect', async int => {
        // Adding item to the trade
        if(int.customId == 'add-item'){
            await int.reply('Please type the name of a reward to add to the trade.');
            const tempMsg = await int.fetchReply();
            const mCol = int.channel.createMessageCollector({filter: m => m.author.id == int.user.id, time: 30000});
            mCol.on('collect', async m => {
                let reward;
                const userdata = await Data.forceGet(channel.guild.id, m.author.id);
                for(const r in rewards){
                    const re = rewards[r];
                    if(re.name.toLowerCase() == m.content.toLowerCase() && userdata.unlocked[re.type].includes(re.id)){
                        if(trade[m.author.id].items.includes(re)) break;
                        if(!re.shown) break;
                        reward = re;
                        break;
                    };
                };
                if(!reward){
                    const tempMsg2 = await m.channel.send(`No reward was found.`);
                    tempMsg2.client.setTimeout(async () => {
                        if(!tempMsg2.deleted) await tempMsg2.delete();
                    }, 3000);
                    return mCol.stop();
                };
                trade[m.author.id].items.push(reward);
                const tempMsg3 = await m.channel.send(`Sucessfully added ${reward.name} to the trade.`);
                tempMsg3.client.setTimeout(async () => {
                    if(!tempMsg3.deleted) await tempMsg3.delete();
                }, 3000);
                await m.delete();
                return mCol.stop();
            });
            mCol.on('end', async () => {
                if(!tempMsg.deleted) await tempMsg.delete();
                await updateTradeEmbed({trade, member, partner, embed, int, message});
            });
        };
        // Removing item from the trade
        if(int.customId == 'remove-item'){
            await int.reply('Please type the name of the reward to remove from the trade.');
            const tempMsg = await int.fetchReply();
            const mCol = int.channel.createMessageCollector({filter: m => m.author.id == int.user.id, time: 30000});
            mCol.on('collect', async m => {
                let reward;
                const userdata = await Data.forceGet(channel.guild.id, m.author.id);
                for(const r in rewards){
                    const re = rewards[r];
                    if(re.name.toLowerCase() == m.content.toLowerCase() && userdata.unlocked[re.type].includes(re.id)){
                        if(!trade[m.author.id].items.includes(re)) break;
                        reward = re;
                        break;
                    };
                };
                if(!reward){
                    const tempMsg2 = await m.channel.send(`No reward was found.`);
                    tempMsg2.client.setTimeout(async () => {
                        if(!tempMsg2.deleted) await tempMsg2.delete();
                    }, 3000);
                    return mCol.stop();
                };
                trade[m.author.id].items = trade[m.author.id].items.filter(r => r != reward);
                const tempMsg3 = await m.channel.send(`Sucessfully removed ${reward.name} from the trade.`);
                tempMsg3.client.setTimeout(async () => {
                    if(!tempMsg3.deleted) await tempMsg3.delete();
                }, 3000);
                await m.delete();
                return mCol.stop();
            });
            mCol.on('end', async () => {
                if(!tempMsg.deleted) await tempMsg.delete();
                await updateTradeEmbed({trade, member, partner, embed, int, message});
            });
        };
        // Points with the trade
        if(int.customId == 'set-points'){
            await int.reply('Please type the amount of points for the trade.');
            const tempMsg = await int.fetchReply();
            const mCol = int.channel.createMessageCollector({filter: m => m.author.id == int.user.id, time: 30000});
            mCol.on('collect', async m => {
                const userdata = await Data.forceGet(channel.guild.id, m.author.id);
                let points = parseInt(m.content);
                if(isNaN(points) || points < 0 || userdata.points < points){
                    const tempMsg2 = await m.channel.send(`Invalid points amount. You must have enough points, the points must be above zero or you didn't type a number.`);
                    tempMsg2.client.setTimeout(async () => {
                        if(!tempMsg2.deleted) await tempMsg2.delete();
                    }, 3000);
                    await m.delete();
                    return mCol.stop();
                };
                trade[m.author.id].points = points;
                const tempMsg3 = await m.channel.send(`${points} points will be added with the trade.`);
                tempMsg3.client.setTimeout(async () => {
                    if(!tempMsg3.deleted) await tempMsg3.delete();
                }, 3000);
                await m.delete();
                return mCol.stop();
            });
            mCol.on('end', async () => {
                if(!tempMsg.deleted) await tempMsg.delete();
                await updateTradeEmbed({trade, member, partner, embed, int, message});
            });
        };

        if(int.customId == 'confirm-trade'){
            trade[int.user.id].confirmed = !trade[int.user.id].confirmed;
            await updateTradeEmbed({trade, member, partner, embed, int, message});
        };

        if(int.customId == 'cancel-trade'){
            await int.update({
                content: `Trade cancelled by ${int.user.tag}.`,
                embeds: [],
                components: []
            });
            collector.stop();
        };
    });
    collector.on('end', () => Data.unlockIds([member.user.id, partner.user.id]));
};

async function updateTradeEmbed({trade, member, partner, embed, int, message}){
    embed.setDescription(`Trade between **${member.user.tag}** and **${partner.user.tag}**:\n\n${trade[member.user.id].confirmed ? '✅' : '⛔'} | **${member.user.tag}**'s offer:`);
    if(trade[member.user.id].points > 0) embed.setDescription(embed.description + `\n• ${trade[member.user.id].points} points`);
    if(trade[member.user.id].items.length){
        for(const item of trade[member.user.id].items){
            embed.setDescription(embed.description + `\n• ${item.name}`);
        };
    } else {
        embed.setDescription(embed.description + `\nNo items!`);
    };
    embed.setDescription(embed.description + `\n\n${trade[partner.user.id].confirmed ? '✅' : '⛔'} | **${partner.user.tag}**'s offer:`);
    if(trade[partner.user.id].points > 0) embed.setDescription(embed.description + `\n• ${trade[partner.user.id].points} points`);
    if(trade[partner.user.id].items.length){
        for(const item of trade[partner.user.id].items){
            embed.setDescription(embed.description + `\n• ${item.name}`);
        };
    } else {
        embed.setDescription(embed.description + `\nNo items!`);
    };
    if(trade[member.user.id].confirmed && trade[partner.user.id].confirmed){
        await endTrade({trade, guild: message.guild, member, partner});
        embed.setTitle('Trade Completed');
        embed.setColor('#33AA22');
        embed.setDescription(`\n\nTrade finished!`);
        if(!int.replied) return await int.update({embeds: [embed], components: []});
        else return await message.edit({embeds: [embed], components: []});
    };
    if(!int.replied) await int.update({embeds:[embed]});
    else await message.edit({embeds:[embed]});
};

async function endTrade({trade, guild, member, partner}){
    let memberdata = await Data.forceGet(guild.id, member.user.id);
    let partnerdata = await Data.forceGet(guild.id, partner.user.id);

    if(trade[member.user.id].points > 0){
        memberdata.points -= trade[member.user.id].points;
        partnerdata.points += trade[member.user.id].points;
    };
    for(const reward of trade[member.user.id].items){
        if(partnerdata.unlocked[reward.type].includes(reward.id)) continue;
        memberdata.unlocked[reward.type] = memberdata.unlocked[reward.type].filter(r => r != reward.id);
        partnerdata.unlocked[reward.type].push(reward.id);
    };
    if(trade[partner.user.id].points > 0){
        partnerdata.points -= trade[partner.user.id].points;
        memberdata.points += trade[partner.user.id].points;
    };
    for(const reward of trade[partner.user.id].items){
        if(memberdata.unlocked[reward.type].includes(reward.id)) continue;
        partnerdata.unlocked[reward.type] = partnerdata.unlocked[reward.type].filter(r => r != reward.id);
        memberdata.unlocked[reward.type].push(reward.id);
    };

    if(!memberdata.unlocked.backgrounds.includes(memberdata.card.background)) memberdata.card.background = 'default_background';
    if(!memberdata.unlocked.frames.includes(memberdata.card.frame)) memberdata.card.frame = 'default_frame';
    if(!partnerdata.unlocked.backgrounds.includes(partnerdata.card.background)) partnerdata.card.background = 'default_background';
    if(!partnerdata.unlocked.frames.includes(partnerdata.card.frame)) partnerdata.card.frame = 'default_frame';
    memberdata.statistics.tradesCompleted += 1;
    partnerdata.statistics.tradesCompleted += 1;
    await Data.forceSet(guild.id, member.user.id, memberdata);
    await Data.forceSet(guild.id, partner.user.id, partnerdata);
    Data.unlockIds([member.user.id, partner.user.id]);
};

module.exports = {
    name:'trade',
    desc:`Initiates a trading sequence.`,
    usage:'!trade [@user]',
    execute: async ({interaction, message}) => {
        const guild = interaction?.guild ?? message?.guild;
        if(!guild) return `This command can not be used outside of a server!`;


        const member = interaction?.member ?? message?.member;
        const partner = interaction?.options?.first().member ?? message?.mentions.members.first();
        if(!partner) return `Usage: ${this.usage}`;
        if(partner.user.bot) return `You can't trade with a bot.`;
        if(member.user.id == partner.user.id) return `You can't trade with yourself.`;

        const channel = interaction?.channel ?? message?.channel;
        if(!channel) return `Invalid channel.`;

        const inviteEmbed = new MessageEmbed()
            .setTitle('Trade request:')
            .setDescription('Press the "accept" button below to accept the trade request.\nYou have 10 seconds to accept or deny the request.')
            .setColor('#664400')
            .setTimestamp()
        
        const inviteRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('accept')
                .setStyle('SUCCESS')
                .setLabel('Accept')
        );
        
        const msg = await channel.send({embeds:[inviteEmbed], components:[inviteRow]});

        msg.awaitMessageComponent({filter: (int) => int.customId == 'accept' && int.user.id == partner.user.id, time: 10000})
            .then(async int => {
                await msg.delete();
                await startTrade({member, partner, channel});
            }, async () => {
                await msg.edit({embeds:[], components:[], content:'Request cancelled.'});
            });
    }
};