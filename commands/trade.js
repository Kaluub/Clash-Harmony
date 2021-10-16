const { MessageEmbed, MessageButton, MessageSelectMenu, MessageActionRow, Collection } = require("discord.js");
const { readJSON } = require('../json.js');
const Data = require('../classes/data.js');

async function trade(msg, member, partner) {
    Data.lockIds([member.user.id, partner.user.id]);

    const rewards = await readJSON('json/rewards.json');

    const trade = new Collection();
    trade.set(member.user.id, {id: member.user.id, tag: member.user.tag, points: 0, items: [], confirmed: false});
    trade.set(partner.user.id, {id: partner.user.id, tag: partner.user.tag, points: 0, items: [], confirmed: false});

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

    const embed = await updateTradeEmbed({trade, rewards});

    await msg.edit({embeds: [embed], components: [row]});

    const collector = msg.createMessageComponentCollector({idle: 120000});

    collector.on('collect', async int => {
        if(!trade.has(int.user.id)) return int.reply(`This isn't your trade!`);

        if(int.customId === 'add-item') {
            const data = await Data.get(int.guild.id, int.user.id);
            const tradeData = trade.get(int.user.id);
            if(tradeData.items.length >= 8) return await int.reply({content: 'There is a maximum of 8 items in a trade!', ephemeral: true})

            const menu = new MessageSelectMenu().setCustomId('items').setPlaceholder('Select items to add here!');
            const options = [];
            const allItems = data.unlocked.backgrounds.concat(data.unlocked.frames);

            for(const id of allItems) {
                const item = rewards[id];
                if(!item.shown) continue;
                if(tradeData.items.includes(item.id)) continue;
                options.push({label: item.name, value: item.id});
            };

            if(!options.length) return await int.reply({content: 'You have no more items!', ephemeral: true});

            menu.addOptions(options).setMinValues(1).setMaxValues(options.length > 8 ? 8 : options.length);

            const reply = await int.reply({content: 'Please select the item(s) you\'d like to add to the trade:', components: [new MessageActionRow().addComponents(menu)], fetchReply: true});
            const menuCollector = reply.createMessageComponentCollector({time: 60000});

            menuCollector.on('collect', async sInt => {
                if(int.user.id !== sInt.user.id) return sInt.reply(`This isn't your trade!`);

                tradeData.items.push(...sInt.values);
                trade.set(sInt.user.id, tradeData);

                trade.forEach(d => d.confirmed = false);

                const update = await updateTradeEmbed({trade, rewards});
                await msg.edit({embeds: [update]});

                await sInt.reply({content: 'Added the items to the trade!', ephemeral: true});
                menuCollector.stop();
            });

            menuCollector.on('end', async () => {
                reply.delete();
            });
        };

        if(int.customId === 'remove-item') {
            let tradeData = trade.get(int.user.id);

            const menu = new MessageSelectMenu().setCustomId('items').setPlaceholder('Select items to remove here!');
            const options = [];

            for(const id of tradeData.items) {
                const item = rewards[id];
                options.push({label: item.name, value: item.id});
            };

            if(!options.length) return await int.reply({content: 'You have no items to remove!', ephemeral: true});

            menu.addOptions(options).setMinValues(1).setMaxValues(tradeData.items.length);

            const reply = await int.reply({content: 'Please select the item(s) you\'d like to remove from the trade:', components: [new MessageActionRow().addComponents(menu)], fetchReply: true});
            const menuCollector = reply.createMessageComponentCollector({time: 60000});

            menuCollector.on('collect', async sInt => {
                if(int.user.id !== sInt.user.id) return sInt.reply(`This isn't your trade!`);
                tradeData.items = tradeData.items.filter(id => !sInt.values.includes(id));
                trade.set(sInt.user.id, tradeData);

                trade.forEach(d => d.confirmed = false);

                const update = await updateTradeEmbed({trade, rewards});
                await msg.edit({embeds: [update]});

                await sInt.reply({content: 'Removed the items from the trade!', ephemeral: true});
                menuCollector.stop();
            });

            menuCollector.on('end', async () => {
                reply.delete();
            });
        };

        if(int.customId === 'set-points') {
            let tradeData = trade.get(int.user.id);
            await int.reply({content: 'Please type the amount of points for the trade.', ephemeral: true});
            const mCol = int.channel.createMessageCollector({filter: m => m.author.id == int.user.id, time: 30000});
            
            mCol.on('collect', async m => {
                const userdata = await Data.get(m.guild.id, m.author.id);
                let points = parseInt(m.content);
                if(isNaN(points) || points < 0 || userdata.points < points){
                    await int.followUp({content: `Invalid points amount. You must have enough points, the points must be above zero or you didn't type a number.`, ephemeral: true});
                    await m.delete();
                    return mCol.stop();
                };
                tradeData.points = points;
                trade.set(int.user.id, tradeData);
                trade.forEach(d => d.confirmed = false);
                await int.followUp({content: `${points} points will be added with the trade.`, ephemeral: true});
                await m.delete();
                mCol.stop();

                const update = await updateTradeEmbed({trade, rewards});
                await msg.edit({embeds: [update]});
            });
        };

        if(int.customId == 'confirm-trade') {
            let data = trade.get(int.user.id);
            data.confirmed = !data.confirmed;
            trade.set(int.user.id, data);

            if(trade.every(u => u.confirmed)) {
                const update = await updateTradeEmbed({trade, rewards}, true);
                await int.update({components: [], embeds: [update]});
                await endTrade({trade, rewards, member, partner});
                return collector.stop();
            } else {
                const update = await updateTradeEmbed({trade, rewards});
                await int.update({embeds: [update]});
            };
        };

        if(int.customId == 'cancel-trade') {
            await int.update({content: `${int.user.tag} cancelled the trade.`, components: [], embeds: []});
            collector.stop();
        };
    });

    collector.on('end', async (col, reason) => {
        Data.unlockIds([member.user.id, partner.user.id]);
        if(reason == 'time' && !msg.deleted) await msg.delete();
    });
};

async function updateTradeEmbed({trade, rewards}, closing = false) {
    const embed = new MessageEmbed()
        .setTitle(closing ? `Completed Trade` : `Trade Interface`)
        .setColor(closing ? `#22DDAA` : `#AA3322`)
        .setTimestamp()
    
    let string = ``;
    let tags = [];

    await trade.forEach(async data => {
        tags.push(`**${data.tag}**`);
        string += `\n\n${data.confirmed ? '✅' : '⛔'} | **${data.tag}**'s offer:`;
        if(!data.items.length && !data.points) string += `\nNo items!`;
        else {
            if(data.points) string += `\nPoints: ${data.points}`;
            if(data.items.length) data.items.forEach(async id => {
                const item = rewards[id];
                string += `\n${item.name}`;
            });
        };
    });

    if(closing) embed.setDescription(`Items traded between ${tags.join(' and ')}:` + string);
    else embed.setDescription(`Trade between ${tags.join(' and ')}:` + string);
    return embed;
};

async function endTrade({trade, rewards, member, partner}){
    let memberdata = await Data.get(member.guild.id, member.user.id);
    let partnerdata = await Data.get(partner.guild.id, partner.user.id);

    const memberTrade = trade.get(member.user.id);
    const partnerTrade = trade.get(partner.user.id);

    if(memberTrade.points > 0){
        memberdata.points -= memberTrade.points;
        partnerdata.points += memberTrade.points;
    };

    for(const id of memberTrade.items){
        const reward = rewards[id];
        if(partnerdata.hasReward(reward)) continue;
        memberdata.removeReward(reward);
        partnerdata.addReward(reward);
    };
    
    if(partnerTrade.points > 0){
        partnerdata.points -= partnerTrade.points;
        memberdata.points += partnerTrade.points;
    };

    for(const id of partnerTrade.items){
        const reward = rewards[id];
        if(memberdata.hasReward(reward)) continue;
        partnerdata.removeReward(reward);
        memberdata.addReward(reward);
    };

    if(!memberdata.unlocked.backgrounds.includes(memberdata.card.background)) memberdata.card.background = 'default_background';
    if(!memberdata.unlocked.frames.includes(memberdata.card.frame)) memberdata.card.frame = 'default_frame';
    if(!partnerdata.unlocked.backgrounds.includes(partnerdata.card.background)) partnerdata.card.background = 'default_background';
    if(!partnerdata.unlocked.frames.includes(partnerdata.card.frame)) partnerdata.card.frame = 'default_frame';
    
    memberdata.statistics.tradesCompleted += 1;
    partnerdata.statistics.tradesCompleted += 1;
    await Data.set(member.guild.id, member.user.id, memberdata);
    await Data.set(partner.guild.id, partner.user.id, partnerdata);
    Data.unlockIds([member.user.id, partner.user.id]);
};

module.exports = {
    name: 'trade',
    desc: `Starts a trade with another member.`,
    usage: '/trade [@user]',
    admin: true,
    options: [
        {
            name: 'member',
            description: "The member to trade with.",
            type: 'USER',
            required: true
        }
    ],
    execute: async ({interaction, message}) => {
        const member = interaction?.member ?? message?.member;
        const partner = interaction?.options.getMember('member') ?? message?.mentions.members.first();
        const channel = interaction?.channel ?? message?.channel;

        if(!partner) return `Usage: ${module.exports.usage}`;
        if(partner.user.bot) return {content: `You can't trade with a bot.`, ephemeral: true};
        if(member.user.id == partner.user.id) return {content: `You can't trade with yourself.`, ephemeral: true};

        const inviteEmbed = new MessageEmbed()
            .setTitle('Trade request:')
            .setDescription(`Press the "accept" button below to accept the trade request.\nYou got 60 seconds to accept or deny the request.`)
            .setColor('#664400')
            .setTimestamp()
        
        const inviteRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('accept')
                .setStyle('SUCCESS')
                .setLabel('Accept'),
            new MessageButton()
                .setCustomId('deny')
                .setStyle('DANGER')
                .setLabel('Deny')
        );

        if(interaction) interaction.reply({content: `We'll start your trade once your partner accepts!`, ephemeral: true});

        const msg = await channel.send({embeds: [inviteEmbed], components: [inviteRow]});
        const collector = await msg.createMessageComponentCollector({time: 60000});

        collector.on('collect', async int => {
            if(int.user.id !== partner.user.id) return int.reply({content: `This trade wasn't meant for you, it was sent to ${partner.user.tag}!`, ephemeral: true});
            if(int.customId == 'accept') {
                await int.reply({content: 'The trade was accepted!', ephemeral: true, embeds: [], components: []});
                await trade(msg, member, partner);
                collector.stop('accepted');
            };
            if(int.customId == 'deny') {
                await int.update({content: 'Your partner denied the trade.', embeds: [], components: []});
                collector.stop('denied');
            };
        });

        collector.on('end', (col, reason) => {
            if(reason === 'accepted' || reason === 'denied') return;
            else msg.edit({content: 'Ran out of time to accept/deny the trade!', embeds: [], components: []});
        });
    }
};