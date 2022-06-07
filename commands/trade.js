const { MessageEmbed, MessageButton, MessageSelectMenu, MessageActionRow, Collection } = require("discord.js");
const { readJSON } = require('../json.js');
const { UserData } = require('../classes/data.js');
const Locale = require('../classes/locale.js');

async function trade(msg, member, partner, locale) {
    UserData.lockIds([member.user.id, partner.user.id]);

    const rewards = await readJSON('json/rewards.json');

    const trade = new Collection();
    trade.set(member.user.id, {id: member.user.id, tag: member.user.tag, points: 0, items: [], confirmed: false});
    trade.set(partner.user.id, {id: partner.user.id, tag: partner.user.tag, points: 0, items: [], confirmed: false});

    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId('add-item')
            .setLabel(Locale.text(locale, "TRADE_BUTTON_ADD_ITEM"))
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('remove-item')
            .setLabel(Locale.text(locale, "TRADE_BUTTON_REMOVE_ITEM"))
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('set-points')
            .setLabel(Locale.text(locale, "TRADE_BUTTON_SET_POINTS"))
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('confirm-trade')
            .setLabel(Locale.text(locale, "BUTTON_CONFIRM"))
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('cancel-trade')
            .setLabel(Locale.text(locale, "BUTTON_CANCEL"))
            .setStyle('DANGER')
    );

    const embed = await updateTradeEmbed({trade, rewards, locale});

    await msg.edit({embeds: [embed], components: [row]});

    const collector = msg.createMessageComponentCollector({idle: 120000});

    collector.on('collect', async int => {
        if(!trade.has(int.user.id)) return int.reply(Locale.text(locale, "TRADE_NOT_FOR_YOU"));

        if(int.customId === 'add-item') {
            const data = await UserData.get(int.guild.id, int.user.id);
            const tradeData = trade.get(int.user.id);
            if(tradeData.items.length >= 8) return await int.reply({content: Locale.text(locale, "TRADE_MAX_ITEMS"), ephemeral: true})

            const menu = new MessageSelectMenu().setCustomId('items').setPlaceholder(Locale.text(locale, "TRADE_SELECT_ADD_ITEMS"));
            const options = [];
            const allItems = data.unlocked.backgrounds.concat(data.unlocked.frames);

            for(const id of allItems) {
                const item = rewards[id];
                if(!item.shown && !item.tradeable) continue;
                if(tradeData.items.includes(item.id)) continue;
                options.push({label: item.name, value: item.id});
            };

            if(!options.length) return await int.reply({content: Locale.text(locale, "TRADE_NO_MORE_ITEMS"), ephemeral: true});

            menu.addOptions(options).setMinValues(1).setMaxValues(options.length > 8 ? 8 : options.length);

            const reply = await int.reply({content: Locale.text(locale, "TRADE_ADD_ITEMS"), components: [new MessageActionRow().addComponents(menu)], fetchReply: true});
            const menuCollector = reply.createMessageComponentCollector({time: 60000});

            menuCollector.on('collect', async sInt => {
                if(int.user.id !== sInt.user.id) return sInt.reply(Locale.text(locale, "TRADE_NOT_FOR_YOU"));

                tradeData.items.push(...sInt.values);
                trade.set(sInt.user.id, tradeData);

                trade.forEach(d => d.confirmed = false);

                const update = await updateTradeEmbed({trade, rewards, locale});
                await msg.edit({embeds: [update]});

                await sInt.reply({content: Locale.text(locale, "TRADE_ITEMS_ADDED"), ephemeral: true});
                menuCollector.stop();
            });

            menuCollector.on('end', async () => {
                reply.delete();
            });
        };

        if(int.customId === 'remove-item') {
            let tradeData = trade.get(int.user.id);

            const menu = new MessageSelectMenu().setCustomId('items').setPlaceholder(Locale.text(locale, "TRADE_SELECT_REMOVE_ITEMS"));
            const options = [];

            for(const id of tradeData.items) {
                const item = rewards[id];
                options.push({label: item.name, value: item.id});
            };

            if(!options.length) return await int.reply({content: Locale.text(locale, "TRADE_NO_REMOVE_ITEMS"), ephemeral: true});

            menu.addOptions(options).setMinValues(1).setMaxValues(tradeData.items.length);

            const reply = await int.reply({content: Locale.text(locale, "TRADE_REMOVE_ITEMS"), components: [new MessageActionRow().addComponents(menu)], fetchReply: true});
            const menuCollector = reply.createMessageComponentCollector({time: 60000});

            menuCollector.on('collect', async sInt => {
                if(int.user.id !== sInt.user.id) return sInt.reply(Locale.text(locale, "TRADE_NOT_FOR_YOU"));
                tradeData.items = tradeData.items.filter(id => !sInt.values.includes(id));
                trade.set(sInt.user.id, tradeData);

                trade.forEach(d => d.confirmed = false);

                const update = await updateTradeEmbed({trade, rewards, locale});
                await msg.edit({embeds: [update]});

                await sInt.reply({content: Locale.text(locale, "TRADE_ITEMS_REMOVED"), ephemeral: true});
                menuCollector.stop();
            });

            menuCollector.on('end', async () => {
                reply.delete();
            });
        };

        if(int.customId === 'set-points') {
            let tradeData = trade.get(int.user.id);
            await int.reply({content: Locale.text(locale, "TRADE_POINTS_PROMPT"), ephemeral: true});
            const mCol = int.channel.createMessageCollector({filter: m => m.author.id == int.user.id, time: 30000});
            
            mCol.on('collect', async m => {
                const userdata = await UserData.get(m.guild.id, m.author.id);
                let points = parseInt(m.content);
                if(isNaN(points) || points < 0 || userdata.points < points){
                    await int.followUp({content: Locale.text(locale, "TRADE_POINTS_INVALID"), ephemeral: true});
                    await m.delete();
                    return mCol.stop();
                };
                tradeData.points = points;
                trade.set(int.user.id, tradeData);
                trade.forEach(d => d.confirmed = false);
                await int.followUp({content: Locale.text(locale, "TRADE_POINTS_SET", points), ephemeral: true});
                await m.delete();
                mCol.stop();

                const update = await updateTradeEmbed({trade, rewards, locale});
                await msg.edit({embeds: [update]});
            });
        };

        if(int.customId == 'confirm-trade') {
            let data = trade.get(int.user.id);
            data.confirmed = !data.confirmed;
            trade.set(int.user.id, data);

            if(trade.every(u => u.confirmed)) {
                const update = await updateTradeEmbed({trade, rewards, locale}, true);
                await int.update({components: [], embeds: [update]});
                await endTrade({trade, rewards, member, partner});
                return collector.stop();
            } else {
                const update = await updateTradeEmbed({trade, rewards, locale});
                await int.update({embeds: [update]});
            };
        };

        if(int.customId == 'cancel-trade') {
            await int.update({content: Locale.text(locale, "TRADE_CANCELLED", int.user.tag), components: [], embeds: []});
            collector.stop();
        };
    });

    collector.on('end', async (col, reason) => {
        UserData.unlockIds([member.user.id, partner.user.id]);
        if(reason == 'time') {
            try {
                await msg.delete();
            } catch { return null; }
        }
    });
};

async function updateTradeEmbed({trade, rewards, locale}, closing = false) {
    const embed = new MessageEmbed()
        .setTitle(closing ? Locale.text(locale, "TRADE_TITLE_COMPLETED") : Locale.text(locale, "TRADE_TITLE"))
        .setColor(closing ? `#22DDAA` : `#AA3322`)
        .setTimestamp()
    
    let string = ``;
    let tags = [];

    await trade.forEach(async data => {
        tags.push(`**${data.tag}**`);
        string += Locale.text(locale, "TRADE_CONTENTS", data.confirmed ? '✅' : '⛔', data.tag);
        if(!data.items.length && !data.points) string += Locale.text(locale, "TRADE_NO_ITEMS");
        else {
            if(data.points) string += Locale.text(locale, "POINTS") + `: ${data.points}`;
            if(data.items.length) data.items.forEach(async id => {
                const item = rewards[id];
                string += `\n${item.name}`;
            });
        };
    });

    if(closing) embed.setDescription(`${Locale.text(locale, "TRADE_DESC_COMPLETED")} ${tags.join(Locale.text(locale, "TRADE_DESC_JOINER"))}:` + string);
    else embed.setDescription(`${Locale.text(locale, "TRADE_DESC")} ${tags.join(Locale.text(locale, "TRADE_DESC_JOINER"))}:` + string);
    return embed;
};

async function endTrade({trade, rewards, member, partner}){
    let memberdata = await UserData.get(member.guild.id, member.user.id);
    let partnerdata = await UserData.get(partner.guild.id, partner.user.id);

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
    await UserData.set(member.guild.id, member.user.id, memberdata);
    await UserData.set(partner.guild.id, partner.user.id, partnerdata);
    UserData.unlockIds([member.user.id, partner.user.id]);
};

module.exports = {
    name: 'trade',
    desc: `Starts a trade with another member.`,
    usage: '/trade [@user]',
    options: [
        {
            name: 'member',
            description: "The member to trade with.",
            type: 'USER',
            required: true
        }
    ],
    execute: async ({interaction, message, userdata}) => {
        const member = interaction?.member ?? message?.member;
        const partner = interaction?.options.getMember('member') ?? message?.mentions.members.first();
        const channel = interaction?.channel ?? message?.channel;

        if(!partner) return `Usage: ${module.exports.usage}`;
        if(partner.user.bot) return {content: Locale.text(userdata.settings.locale, "NO_TRADE_BOT"), ephemeral: true};
        if(member.user.id == partner.user.id) return {content: Locale.text(userdata.settings.locale, "NO_TRADE_SELF"), ephemeral: true};

        const inviteEmbed = new MessageEmbed()
            .setTitle(Locale.text(userdata.settings.locale, "TRADE_REQUEST_TITLE"))
            .setDescription(Locale.text(userdata.settings.locale, "TRADE_REQUEST_TITLE"))
            .setColor('#664400')
            .setTimestamp()
        
        const inviteRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('accept')
                .setStyle('SUCCESS')
                .setLabel(Locale.text(userdata.settings.locale, "BUTTON_ACCEPT")),
            new MessageButton()
                .setCustomId('deny')
                .setStyle('DANGER')
                .setLabel(Locale.text(userdata.settings.locale, "BUTTON_DENY"))
        );

        if(interaction) interaction.reply({content: Locale.text(userdata.settings.locale, "TRADE_REQUEST_NOTE"), ephemeral: true});

        const msg = await channel.send({embeds: [inviteEmbed], components: [inviteRow]});
        const collector = await msg.createMessageComponentCollector({time: 60000});

        collector.on('collect', async int => {
            if(int.user.id !== partner.user.id) return int.reply({content: Locale.text(userdata.settings.locale, "TRADE_NOT_FOR_YOU"), ephemeral: true});
            if(int.customId == 'accept') {
                await int.reply({content: Locale.text(userdata.settings.locale, "TRADE_ACCEPTED"), ephemeral: true, embeds: [], components: []});
                await trade(msg, member, partner, userdata.settings.locale);
                collector.stop('accepted');
            };
            if(int.customId == 'deny') {
                await int.update({content: Locale.text(userdata.settings.locale, "TRADE_DENIED"), embeds: [], components: []});
                collector.stop('denied');
            };
        });

        collector.on('end', (col, reason) => {
            if(reason === 'accepted' || reason === 'denied') return;
            else msg.edit({content: Locale.text(userdata.settings.locale, "TRADE_TIMED_OUT"), embeds: [], components: []});
        });
    }
};