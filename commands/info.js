const { readJSON } = require('../json.js');
const { guessRewards } = require('../functions.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = {
    name: 'info',
    aliases: ['i'],
    desc: `This is a command for viewing the info of a reward.`,
    usage: '/info [reward name]',
    options: [
        {
            "name": "reward",
            "description": "The reward name to view the info for.",
            "type": "STRING",
            "required": true
        }
    ],
    execute: async ({interaction,message,args}) => {
        if(!args[0]) return `Usage: ${module.exports.usage}`;
        const member = interaction?.member ?? message?.member;
        let rewards = await readJSON('json/rewards.json');
        let name = args.join(' ');
        let item = null;

        let possibleRewards = await guessRewards(rewards,name);

        if(possibleRewards.length == 0){
            return 'There are no rewards with or similar to this name.';
        } else if(possibleRewards.length == 1){
            item = possibleRewards[0];
            const attachment = new MessageAttachment(`./img/${item.type}/${item.img}`, item.img);
            const embed = new MessageEmbed()
                .setTitle(`Info: ${item.name}`)
                .setColor('#77DD77')
                .setDescription(`Price: ${item.price}\nDescription: ${item.desc}`)
                .setImage(`attachment://${item.img}`);
            return {embeds:[embed], files:[attachment]};
        } else if(possibleRewards.length < 10){
            const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
            const embed = new MessageEmbed()
                .setTitle('Similar rewards:')
                .setColor('#AEC6CF')
                .setDescription('Loading...');
            let msg = await message?.channel.send({embeds:[embed]});
            if(!msg) {
                await interaction?.reply({embeds:[embed]});
                msg = await interaction?.fetchReply();
            };
            embed.setDescription('A list of similar rewards is provided here.\nTo select one, react with the corresponding emoji.\n');
            for(const i in possibleRewards){
                let reward = possibleRewards[i];
                let index = possibleRewards.indexOf(reward);
                embed.setDescription(embed.description + `\n${emojis[index]}: ${reward.name}`);
                await msg.react(emojis[index]);
            };
            await msg.react('⛔');
            await msg.edit({embeds:[embed]});

            const collector = await msg.createReactionCollector({filter: (reaction, user) => user.id == member.user.id && emojis.includes(reaction.emoji.name) || reaction.emoji.name == '⛔', idle: 30000});
            collector.on('collect', async (reaction, user) => {
                if(reaction.emoji.name == '⛔'){
                    if(message?.deleteable && !message?.deleted) await message?.delete();
                    await msg.delete();
                    return collector.stop('cancelled');
                };
                let index = emojis.indexOf(reaction.emoji.name);
                item = possibleRewards[index];
                const attachment = new MessageAttachment(`./img/${item.type}/${item.img}`, item.img);
                const embed = new MessageEmbed()
                    .setTitle(`Info: ${item.name}`)
                    .setColor('#77DD77')
                    .setDescription(`Price: ${item.price}\nDescription: ${item.desc}`)
                    .setImage(`attachment://${item.img}`);
                await msg.delete();
                collector.stop('success');
                const channel = interaction?.channel ?? message?.channel;
                channel.send({embeds:[embed], files:[attachment]});
            });
        } else {
            return `There are too many items (${possibleRewards.length}) with a similar name! Consider being a little more specific.`;
        };
    }
};