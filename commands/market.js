const Market = require('../classes/market.js');
const MarketItem = require('../classes/marketitem.js');
const {readJSON} = require('../json.js');
const {MessageEmbed, MessageActionRow, MessageButton} = require("discord.js");
const Keyv = require('keyv');
const db = new Keyv('sqlite://data/users.sqlite', {namespace:'guilds'});

class MarketEmbed extends MessageEmbed {
    constructor(){
        super();
        return new MessageEmbed()
            .setTitle('Market')
            .setColor('#55BB55')
            .setDescription('Here is all the items listed on the marketplace currently:')
    };
};

module.exports = {
    name:'market',
    desc:'A command for interacting with the market.',
    usage:'/market [list/add]',
    admin: true,
    execute: async ({interaction, message, args}) => {
        if(!args.length) return `Usage: ${module.exports.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        const rewards = readJSON('json/rewards.json');
        let market = await db.get(`${guild.id}/Market`);
        market = new Market(market);
        await db.set(`${guild.id}/Market`, market);

        if(args[0] == 'list'){
            const embeds = [new MarketEmbed()];
            let currentEmbed = 0;
            let currentEmbedItems = 0;

            if(args.includes('-n')) market.items.sort((a,b) => (a.item > b.item) ? 1 : ((b.item > a.item) ? -1 : 0));
            if(args.includes('-p')) market.items.sort((a,b) => (a.price > b.price) ? 1 : ((b.price > a.price) ? -1 : 0));
            if(args.includes('-t')) market.items.sort((a,b) => (a.timestamp > b.timestamp) ? 1 : ((b.timestamp > a.timestamp) ? -1 : 0));
            for(const item of market.items){
                if(item.timestamp < Date.now()) continue;
                if(currentEmbedItems >= 15){
                    embeds.push(new MarketEmbed());
                    currentEmbed += 1;
                    currentEmbedItems = 0;
                };
                let reward = await rewards.rewards[item.category][item.item];
                embeds[currentEmbed].setDescription(embeds[currentEmbed].description + `\n**${reward.name}**: ${item.price} points (${Math.floor((item.timestamp + (market.itemLifespan * 3600000) - Date.now()) / 3600000)} hours)`);
                currentEmbedItems += 1;
            };
            if(embeds[0].description.split(/\r\n|\r|\n/).length < 2) return `There is nothing on the market!`;

            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('back')
                    .setLabel('Back')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('up')
                    .setLabel('Up')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('select')
                    .setLabel('Select')
                    .setStyle('DANGER'),
                new MessageButton()
                    .setCustomId('down')
                    .setLabel('Down')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle('PRIMARY')
            );
            if(embeds.length < 2) row.components.forEach(component => {if(component.customId == 'back' || component.customId == 'next') component.setDisabled(true)});

            let page = 0;
            let sel = 0;

            let descArr = embeds[page].description.replace('➡️ ', '').split('\n');
            descArr[sel + 1] = "➡️ " + descArr[sel + 1];
            let msg = await message?.channel.send({embeds:[embeds[page].setDescription(descArr.join('\n')).setFooter(`Page: ${page + 1}/${embeds.length}`)], components: [row]});
            if(!msg) {
                await interaction.reply({embeds:[embeds[page].setDescription(descArr.join('\n')).setFooter(`Page: ${page + 1}/${embeds.length}`)], components: [row]});
                msg = await interaction.fetchReply();
            };

            const collector = msg.createMessageComponentCollector(interaction => interaction.user.id == member.user.id, {time:300000});
            collector.on('collect', async (interaction) => {
                if(interaction.customId == 'back'){
                    page -= 1;
                    sel = 0;
                    if(page < 0) page = embeds.length - 1;
                };
                if(interaction.customId == 'next'){
                    page += 1;
                    sel = 0;
                    if(page >= embeds.length) page = 0;
                };
                if(interaction.customId == 'up'){
                    sel -= 1;
                    if(sel < 0) sel = embeds[page].description.split('\n').length - 2;
                };
                if(interaction.customId == 'down'){
                    sel += 1;
                    if(sel >= embeds[page].description.split('\n').length - 1) sel = 0;
                };
                if(interaction.customId == 'select'){
                    const item = market.items;
                } else {
                    descArr = embeds[page].description.replace('➡️ ', '').split('\n');
                    descArr[sel + 1] = "➡️ " + descArr[sel + 1];
                    await interaction.update({embeds:[embeds[page].setDescription(descArr.join('\n')).setFooter(`Page: ${page + 1}/${embeds.length}`)]});
                };
            });
            collector.on('stop', async (res) => {
                if(!msg.deleted) await msg.edit({embeds:[embeds[page].setFooter(`Page: ${page + 1}/${embeds.length} | EXPIRED`)], components: []});
            });
        };

        if(args[0] == 'add'){ // testing
            if(!args[1] || !args[2] || !args[3]) return `Usage: ${module.exports.usage} (todo)`;
            const marketitem = new MarketItem({id: member.user.id, item: args[1], category: args[2], price: parseInt(args[3]), timestamp: Date.now()});
            market.items.push(marketitem);
            await db.set(`${guild.id}/Market`, market);
            return '```' + JSON.stringify(marketitem, null, 4) + '```';
        };
    }
};