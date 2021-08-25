const { MessageEmbed } = require('discord.js');
const {guessRewards, economyLog} = require('../functions.js');
const Keyv = require('keyv');
const { readJSON } = require('../json');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

async function buyItem(member,guild,item,userdata,msg){
    if(!item || !userdata) return await msg.edit({embeds:[], content:'No rewards found.'});
    if(item.endTime && item.endTime < Date.now()) return await msg.edit({embeds:[], content:`This reward is not available right now!`});
    if(item.startTime && item.startTime > Date.now()) return await msg.edit({embeds:[], content:`This reward is not available right now!`});

    let discount = 0; // Price booster
    for(const i in userdata.unlocked.features){
        const feature = userdata.unlocked.features[i];
        if(!feature.startsWith('DISCOUNT')) continue;
        const num = parseInt(feature.split(`_`)[1]);
        if(isNaN(num)) continue;
        discount += num;
    };
    if(discount > 1) discount = 1;

    if(item.type == 'frames' || item.type == 'backgrounds'){
        if(userdata.unlocked[item.type].includes(item.id)) return await msg.edit({embeds:[], content:'You already have this reward!'});
        if(userdata.points < Math.floor(item.price - item.price * discount)) return await msg.edit({embeds:[], content:`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`});
        userdata.unlocked[item.type].push(item.id);
        userdata.points -= Math.floor(item.price - item.price * discount);
        userdata.statistics.spent += item.price;
        await userdb.set(`${guild.id}/${member.user.id}`,userdata);
        economyLog(guild.id, member.user, item);
        await msg.edit({embeds:[], content:`You purchased the ${item.name} for ${Math.floor(item.price - item.price * discount)} points.`});
    } else if(item.type == 'roles'){
        if(guild.id != '636986136283185172') return await msg.edit({embeds:[], content:'This reward can only be claimed in the Clash & Harmony Discord server!'});
        if(member.roles.cache.has(item.id)) return await msg.edit({embeds:[], content:'You already have this reward!'});
        if(userdata.points < Math.floor(item.price - item.price * discount)) return await msg.edit({embeds:[], content:`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`});
        userdata.points -= Math.floor(item.price - item.price * discount);
        userdata.statistics.spent += item.price;
        userdata.unlocked[item.type].push(item.id);
        await userdb.set(`${guild.id}/${member.user.id}`, userdata);
        await member.roles.add(item.id,'Delivering purchase reward.');
        economyLog(guild.id, member.user, item);
        await msg.edit({embeds:[], content:`You purchased the ${item.name} for ${Math.floor(item.price - item.price * discount)} points.`});
    } else if(item.type == 'services'){
        if(userdata.points < Math.floor(item.price - item.price * discount)) return await msg.edit({embeds:[], content:`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`});
        userdata.points -= Math.floor(item.price - item.price * discount);
        userdata.statistics.spent += item.price;
        await userdb.set(`${guild.id}/${member.user.id}`, userdata);
        const LMO = await member.client.users.fetch('186459664974741504');
        const embed = new MessageEmbed().setTimestamp().setTitle('Service requested:').setDescription(`${member.user} (${member.user.tag}):\nThis user has ordered the "${item.name}" service for ${item.price} points.`)
        await LMO.send({embeds:[embed]});
        economyLog(guild.id, member.user, item);
        await msg.edit({embeds:[], content:`You purchased the ${item.name} for ${Math.floor(item.price - item.price * discount)} points.`});
    } else {
        await msg.edit({embeds:[], content:`There was an error purchasing this item.`});
    };
}

module.exports = {
    name:'buy',
    aliases:['b'],
    admin:false,
    desc:'This command is used to purchase rewards from the shop.',
    usage:'/buy [reward name]',
    execute: async ({interaction, message, args}) => {
        if(!args[0]) return `Usage: ${module.exports.usage}`;
        const member = interaction?.member ?? message?.member;
        const guild = interaction?.guild ?? message?.guild;
        let userdata = await userdb.get(`${guild.id}/${member.user.id}`);
        let rewards = await readJSON('json/rewards.json');
        let name = args.join(' ');
        let item = null;

        let possibleRewards = await guessRewards(rewards, name, true);

        if(possibleRewards.length == 0){
            return 'There are no rewards with or similar to this name.';
        } else if(possibleRewards.length == 1){
            item = possibleRewards[0];
            let msg = await message?.channel.send("Purchasing item...");
            if(!msg) {
                await interaction?.reply("Purchasing item...");
                msg = await interaction?.fetchReply();
            };
            await buyItem(member,guild,item,userdata,msg);
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
                embed.setDescription(embed.description + `\n${emojis[index]}: ${reward.name} (${reward.price} points)`);
                await msg.react(emojis[index]);
            };
            
            await msg.react('⛔');
            await msg.edit({embeds:[embed]});

            const collector = await msg.createReactionCollector((reaction, user) => user.id == member.user.id && emojis.includes(reaction.emoji.name) || reaction.emoji.name == '⛔', {time:300000});
            collector.on('collect', async (reaction, user) => {
                if(reaction.emoji.name == '⛔'){
                    if(!message?.deleted && message?.deletable) await message?.delete();
                    if(!msg.deleted && msg.deletable) await msg.delete();
                    collector.stop('cancelled');
                };
                let index = emojis.indexOf(reaction.emoji.name);
                item = await possibleRewards[index];
                await reaction.users.remove(user);
                collector.stop('success');
            });

            collector.on('end', async (collected, reason) => {
                if(reason == 'cancelled' || reason == 'time') return;
                if(!msg.deleted) await msg.reactions.removeAll();
                await buyItem(member,guild,item,userdata,msg);
            });
        } else {
            return `There are too many items (${possibleRewards.length}) with a similar name! Consider being a little more specific.`;
        };
    }
};