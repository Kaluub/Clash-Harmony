const {readJSON} = require('../json.js');
const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

class BaseEmbed extends MessageEmbed {
    constructor(type, num){
        super();
        return this
            .setColor('DARK_ORANGE')
            .setTitle(`Shop Interface (${type} #${num})`)
            .setDescription(`To purchase an item, use \`!buy [name]\`.\n`)
    }
}

module.exports = {
    name:'shop',
    aliases:['s'],
    admin:false,
    desc:'This is a command for displaying the shop.',
    usage:'!shop',
    execute: async ({interaction,message,args}) => {
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let userdata = await userdb.get(`${guild.id}/${member.user.id}`);
        let rewards = await readJSON('json/rewards.json');

        const menuRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('backgrounds')
                .setLabel('Backgrounds')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('frames')
                .setLabel('Frames')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('roles')
                .setLabel('Roles')
                .setStyle('PRIMARY')
        );

        const categoryRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('back')
                .setLabel('Back')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle('PRIMARY')
        );

        const menuEmbed = new MessageEmbed()
            .setColor('#33AA33')
            .setTitle(`Shop Interface (${member.user.tag}):`)
            .setDescription(`You have ${userdata.points} points right now.\nTo select a category, use the buttons below.`)
            .setFooter(`This message expires at:`)
            .setTimestamp(Date.now() + 300000);
        
        let shopEmbeds = {
            current: 'menu',
            backgrounds: {
                pageNum: 1,
                count: 0,
                embeds: [new BaseEmbed('Backgrounds', '1')]
            },
            frames: {
                pageNum: 1,
                count: 0,
                embeds: [new BaseEmbed('Frames', '1')]
            },
            roles: {
                pageNum: 1,
                count: 0,
                embeds: [new BaseEmbed('Roles', '1')]
            }
        };

        for(const i in rewards){
            const reward = rewards[i];
            if(shopEmbeds[reward.type].count > 14){
                shopEmbeds[reward.type].count = 0;
                shopEmbeds[reward.type].embeds.push(new BaseEmbed(reward.type[0].toUpperCase() + reward.type.substring(1), shopEmbeds[reward.type].embeds.length + 1))
            };
            shopEmbeds[reward.type].count += 1;
            shopEmbeds[reward.type].embeds[shopEmbeds[reward.type].embeds.length - 1]
                .setDescription(shopEmbeds[reward.type].embeds[shopEmbeds[reward.type].embeds.length - 1].description + `\n• ${reward.name} (${reward.price} points)`)
        };
        
        let msg = await message?.channel.send({embeds:[menuEmbed], components: [menuRow]});
        if(!msg) {
            await interaction?.reply({embeds:[menuEmbed]});
            msg = await interaction?.fetchReply();
        };

        console.log(shopEmbeds)
        let collector = msg.createMessageComponentCollector({filter: int => int.user.id == member.user.id, idle:300000});
        collector.on('collect', async int => {
            if(int.customId == 'backgrounds'){
                shopEmbeds.current = 'backgrounds';
                await int.update({embeds: [shopEmbeds[shopEmbeds.current].embeds[shopEmbeds[shopEmbeds.current].pageNum - 1]], components: [categoryRow]})
            };

            if(int.customId == 'frames'){
                shopEmbeds.current = 'frames';
                await int.update({embeds: [shopEmbeds[shopEmbeds.current].embeds[shopEmbeds[shopEmbeds.current].pageNum - 1]], components: [categoryRow]})
            };

            if(int.customId == 'roles'){
                shopEmbeds.current = 'roles';
                await int.update({embeds: [shopEmbeds[shopEmbeds.current].embeds[shopEmbeds[shopEmbeds.current].pageNum - 1]], components: [categoryRow]})
            };

            if(int.customId == 'back'){
                shopEmbeds.current = 'menu';
                await int.update({embeds: [menuEmbed], components: [menuRow]});
            };

            if(int.customId == 'previous'){
                shopEmbeds[shopEmbeds.current].pageNum -= 1;
                if(shopEmbeds[shopEmbeds.current].pageNum < 1) shopEmbeds[shopEmbeds.current].pageNum = shopEmbeds[shopEmbeds.current].embeds.length;
                await int.update({embeds: [shopEmbeds[shopEmbeds.current].embeds[shopEmbeds[shopEmbeds.current].pageNum - 1]], components: [categoryRow]});
            };

            if(int.customId == 'next'){
                shopEmbeds[shopEmbeds.current].pageNum += 1;
                if(shopEmbeds[shopEmbeds.current].pageNum > shopEmbeds[shopEmbeds.current].embeds.length) shopEmbeds[shopEmbeds.current].pageNum = 1;
                await int.update({embeds: [shopEmbeds[shopEmbeds.current].embeds[shopEmbeds[shopEmbeds.current].pageNum - 1]], components: [categoryRow]});
            };
        });
        collector.on('end', async () => {
            if(!msg.deleted) await msg.edit({embeds: [new MessageEmbed().setDescription('Expired.')], components: []});
        });
    }
};