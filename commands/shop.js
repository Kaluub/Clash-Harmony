const { readJSON } = require('../json.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const Data = require('../classes/data.js');
const Locale = require('../classes/locale.js');

function BaseEmbed(type, num, locale, points) {
    return new MessageEmbed()
        .setTitle(`${Locale.text(locale, "SHOP_TITLE")} (${type} #${num})`)
        .setDescription(Locale.text(locale, "SHOP_DESC", points))
        .setColor('#33AA33')
        .setTimestamp()
};

function BaseSelect(locale) {
    return new MessageSelectMenu()
        .setCustomId('purchase')
        .setPlaceholder(Locale.text(locale, "SHOP_PURCHASE_SELECT"));
};

async function purchase(int, rewards, locale) {
    let data = await Data.get(int.guild.id, int.user.id);

    const reward = rewards[int.values[0]];
    console.log(reward)
    if(data.hasReward(reward)) return await int.reply({content: Locale.text(locale, "SHOP_ITEM_OWNED"), ephemeral: true});
    if(data.points < reward.price) return await int.reply({content: Locale.text(locale, "SHOP_USER_BROKE"), ephemeral: true});
    data.addReward(reward);
    data.points -= reward.price;
    await Data.set(int.guild.id, int.user.id, data);
    if(reward.type == 'roles') await int.member.roles.add(reward.id, 'Delivering purchase reward.');
    return await int.reply({content: Locale.text(locale, "SHOP_TRANSACTION"), ephemeral: true});
};

module.exports = {
    name: 'shop',
    aliases: ['mart'],
    desc: 'This is a command for displaying the shop.',
    usage: '/shop',
    options: [
        {
            "name": "filter",
            "description": "The text filter to apply to the shop.",
            "type": "STRING",
            "required": false
        }
    ],
    execute: async ({interaction, message, userdata}) => {
        const member = interaction?.member ?? message?.member;
        let rewards = await readJSON('json/rewards.json');

        const menuRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('backgrounds')
                .setLabel(Locale.text(userdata.locale, "BUTTON_BACKGROUNDS"))
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('frames')
                .setLabel(Locale.text(userdata.locale, "BUTTON_FRAMES"))
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('roles')
                .setLabel(Locale.text(userdata.locale, "BUTTON_ROLES"))
                .setStyle('PRIMARY')
        );

        const categoryRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('back')
                .setLabel(Locale.text(userdata.locale, "BUTTON_BACK"))
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('previous')
                .setLabel(Locale.text(userdata.locale, "BUTTON_PREVIOUS"))
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('next')
                .setLabel(Locale.text(userdata.locale, "BUTTON_NEXT"))
                .setStyle('PRIMARY')
        );

        const purchaseRow = new MessageActionRow();

        const menuEmbed = new MessageEmbed()
            .setColor('#33AA33')
            .setTitle(`${Locale.text(userdata.locale, "SHOP_TITLE")} (${member.user.tag}):`)
            .setDescription(Locale.text(userdata.locale, "SHOP_DESC", userdata.points))
        
        let shop = {
            current: 'menu',
            backgrounds: {
                pageNum: 1,
                count: 0,
                embeds: [BaseEmbed(Locale.text(userdata.locale, "BUTTON_BACKGROUNDS"), '1', userdata.locale, userdata.points)],
                selects: [BaseSelect(userdata.locale)]
            },
            frames: {
                pageNum: 1,
                count: 0,
                embeds: [BaseEmbed(Locale.text(userdata.locale, "BUTTON_FRAMES"), '1', userdata.locale, userdata.points)],
                selects: [BaseSelect(userdata.locale)]
            },
            roles: {
                pageNum: 1,
                count: 0,
                embeds: [BaseEmbed(Locale.text(userdata.locale, "BUTTON_ROLES"), '1', userdata.locale, userdata.points)],
                selects: [BaseSelect(userdata.locale)]
            }
        };

        // Build pages:
        for(const i in rewards){
            const reward = rewards[i];
            if(!reward.shown) continue;
            if(reward.endTime && reward.endTime < Date.now()) continue;
            if(reward.startTime && reward.startTime > Date.now()) continue;

            if(shop[reward.type].count > 14){
                shop[reward.type].count = 0;
                shop[reward.type].embeds.push(BaseEmbed(reward.type[0].toUpperCase() + reward.type.substring(1), shop[reward.type].embeds.length + 1, userdata.locale, userdata.points));
                shop[reward.type].selects.push(BaseSelect(userdata.locale));
            };
            
            shop[reward.type].count += 1;
            shop[reward.type].embeds[shop[reward.type].embeds.length - 1]
                .setDescription(shop[reward.type].embeds[shop[reward.type].embeds.length - 1].description + `\n• ${reward.name} (${reward.price} points)`)
            shop[reward.type].selects[shop[reward.type].selects.length - 1]
                .addOptions([{label: reward.name, value: reward.id}]);
        };
        
        let msg = await message?.channel.send({embeds:[menuEmbed], components: [menuRow]});
        if(!msg) {
            await interaction?.reply({embeds: [menuEmbed], components: [menuRow]});
            msg = await interaction?.fetchReply();
        };

        let collector = msg.createMessageComponentCollector({filter: int => int.user.id == member.user.id, idle: 30000});
        collector.on('collect', async int => {
            if(int.customId == 'backgrounds') {
                shop.current = 'backgrounds';
                await int.update({embeds: [shop[shop.current].embeds[shop[shop.current].pageNum - 1]], components: [purchaseRow.setComponents(shop[shop.current].selects[shop[shop.current].pageNum - 1]), categoryRow]})
            };

            if(int.customId == 'frames') {
                shop.current = 'frames';
                await int.update({embeds: [shop[shop.current].embeds[shop[shop.current].pageNum - 1]], components: [purchaseRow.setComponents(shop[shop.current].selects[shop[shop.current].pageNum - 1]), categoryRow]})
            };

            if(int.customId == 'roles') {
                shop.current = 'roles';
                await int.update({embeds: [shop[shop.current].embeds[shop[shop.current].pageNum - 1]], components: [purchaseRow.setComponents(shop[shop.current].selects[shop[shop.current].pageNum - 1]), categoryRow]})
            };

            if(int.customId == 'back') {
                shop.current = 'menu';
                await int.update({embeds: [menuEmbed], components: [menuRow]});
            };

            if(int.customId == 'previous') {
                shop[shop.current].pageNum -= 1;
                if(shop[shop.current].pageNum < 1) shop[shop.current].pageNum = shop[shop.current].embeds.length;
                await int.update({embeds: [shop[shop.current].embeds[shop[shop.current].pageNum - 1]], components: [purchaseRow.setComponents(shop[shop.current].selects[shop[shop.current].pageNum - 1]), categoryRow]});
            };

            if(int.customId == 'next'){
                shop[shop.current].pageNum += 1;
                if(shop[shop.current].pageNum > shop[shop.current].embeds.length) shop[shop.current].pageNum = 1;
                await int.update({embeds: [shop[shop.current].embeds[shop[shop.current].pageNum - 1]], components: [purchaseRow.setComponents(shop[shop.current].selects[shop[shop.current].pageNum - 1]), categoryRow]});
            };

            if(int.customId == 'purchase') {
                await purchase(int, rewards, userdata.locale);
            };
        });
        collector.on('end', async () => {
            if(!msg.deleted) await msg.edit({embeds: [new MessageEmbed().setDescription(Locale.text(userdata.locale, "EXPIRED"))], components: []});
        });
    }
};