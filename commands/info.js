const {readJSON} = require('../json.js');
const {guessRewards} = require('../functions.js');
const {MessageEmbed} = require('discord.js');

module.exports = {
    name:'info',
    aliases:['i'],
    admin:false,
    desc:`This is a command for viewing the info of a reward.`,
    usage:'!info [reward name]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        let rewards = await readJSON('rewards.json');
        let name = args.join(' ');
        let item, category = null;

        let possibleRewards = await guessRewards(rewards,name);

        if(possibleRewards.length == 0){
            return message.channel.send('There are no rewards with or similar to this name.');
        } else if(possibleRewards.length == 1){
            item = possibleRewards[0];
            category = possibleRewards[0].colour ? 'backgrounds' : 'frames';
            const embed = new MessageEmbed()
                .setTitle(`Info: ${item.name}`)
                .setColor('#77DD77')
                .setDescription(`Price: ${item.price}\nDescription: ${item.desc}`)
                .attachFiles([`./img/${category}/${item.img}`])
                .setImage(`attachment://${item.img}`);
            message.channel.send(embed);
        } else if(possibleRewards.length < 10){
            const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
            const embed = new MessageEmbed()
                .setTitle('Similar rewards:')
                .setColor('#AEC6CF')
                .setDescription('Loading...');
            const msg = await message.channel.send({embed:embed});
            embed.setDescription('A list of similar rewards is provided here.\nTo select one, react with the corresponding emoji.\n');
            for(const i in possibleRewards){
                let reward = possibleRewards[i];
                let index = possibleRewards.indexOf(reward);
                embed.setDescription(embed.description + `\n${emojis[index]}: ${reward.name}`);
                await msg.react(emojis[index]);
            };
            await msg.react('⛔');
            await msg.edit({embed:embed});
            const collector = await msg.createReactionCollector((reaction, user) => user.id == message.author.id && emojis.includes(reaction.emoji.name) || reaction.emoji.name == '⛔', {time:300000});
            collector.on('collect', async (reaction, user) => {
                if(reaction.emoji.name == '⛔'){
                    await message.delete().catch(null);
                    await msg.delete();
                    return collector.stop('cancelled');
                };
                let index = emojis.indexOf(reaction.emoji.name);
                item = await possibleRewards[index];
                category = item.colour ? 'backgrounds' : 'frames';
                const embed = new MessageEmbed()
                    .setTitle(`Info: ${item.name}`)
                    .setColor('#77DD77')
                    .setDescription(`Price: ${item.price}\nDescription: ${item.desc}`)
                    .attachFiles([`./img/${category}/${item.img}`])
                    .setImage(`attachment://${item.img}`);
                message.channel.send(embed);
                await msg.delete();
                return collector.stop('success');
            });
            collector.on('end', async (collected, reason) => {
                if(reason == 'cancelled' || reason == 'time') return;
            })
        } else {
            return message.channel.send(`There are too many items (${possibleRewards.length}) with a similar name! Consider being a little more specific.`);
        };
    }
};