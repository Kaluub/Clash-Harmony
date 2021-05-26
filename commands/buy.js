const { MessageEmbed } = require('discord.js');
const {guessRewards, economyLog} = require('../functions.js');
const Keyv = require('keyv');
const { readJSON } = require('../json');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

async function buyItem(member,guild,item,category,userdata,msg){
    if(!item || !category || !userdata) return await msg.edit({embed:null, content:'No rewards found.'});
    if(item.endTime && item.endTime < Date.now()) return await msg.edit({embed:null, content:`This reward is not available right now!`});
    if(item.startTime && item.startTime > Date.now()) return await msg.edit({embed:null, content:`This reward is not available right now!`});

    let discount = 0; // Price booster
    for(const i in userdata.unlocked.features){
        const feature = userdata.unlocked.features[i];
        if(!feature.startsWith('DISCOUNT')) continue;
        const num = parseInt(feature.split(`_`)[1]);
        if(isNaN(num)) continue;
        discount += num;
    };
    if(discount > 1) discount = 1;

    if(category == 'frames' || category == 'backgrounds'){
        if(userdata.unlocked[category].includes(item.id)) return await msg.edit({embed:null, content:'You already have this reward!'});
        if(userdata.points < Math.floor(item.price - item.price * discount)) return await msg.edit({embed:null, content:`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`});
        userdata.unlocked[category].push(item.id);
        userdata.points -= Math.floor(item.price - item.price * discount);
        userdata.statistics.spent += item.price;
        await userdb.set(`${guild.id}/${member.user.id}`,userdata);
        economyLog(guild.id, member.user, item);
        await msg.edit({embed:null, content:`You purchased the ${item.name} for ${Math.floor(item.price - item.price * discount)} points.`});
    } else if(category == 'roles'){
        if(guild.id != '636986136283185172') return await msg.edit({embed:null, content:'This reward can only be claimed in the Clash & Harmony Discord server!'});
        if(member.roles.cache.has(item.id)) return await msg.edit({embed:null, content:'You already have this reward!'});
        if(userdata.points < Math.floor(item.price - item.price * discount)) return await msg.edit({embed:null, content:`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`});
        userdata.points -= Math.floor(item.price - item.price * discount);
        userdata.statistics.spent += item.price;
        await userdb.set(`${guild.id}/${member.user.id}`,userdata);
        await member.roles.add(item.id,'Delivering purchase reward.');
        economyLog(guild.id, member.user, item);
        await msg.edit({embed:null, content:`You purchased the ${item.name} for ${Math.floor(item.price - item.price * discount)} points.`});
    } else if(category == 'services'){
        if(userdata.points < Math.floor(item.price - item.price * discount)) return await msg.edit({embed:null, content:`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`});
        userdata.points -= Math.floor(item.price - item.price * discount);
        userdata.statistics.spent += item.price;
        await userdb.set(`${guild.id}/${member.user.id}`,userdata);
        const LMO = await member.client.users.fetch('186459664974741504');
        const embed = new MessageEmbed().setTimestamp().setTitle('Service requested:').setDescription(`${member.user} (${member.user.tag}):\nThis user has ordered the "${item.name}" service for ${item.price} points.`)
        await LMO.send(embed);
        economyLog(guild.id, member.user, item);
        await msg.edit({embed:null, content:`You purchased the ${item.name} for ${Math.floor(item.price - item.price * discount)} points.`});
    } else {
        await msg.edit({embed:null, content:`There was an error purchasing this item.`});
    };
}

module.exports = {
    name:'buy',
    aliases:['b'],
    admin:false,
    desc:'This command is used to purchase rewards from the shop.',
    usage:'!buy [reward name]',
    async execute({interaction,message,args}){
        if(!args[0]) return `Usage: ${this.usage}`;
        const member = interaction?.member ?? message?.member;
        const guild = interaction?.guild ?? message?.guild;
        let userdata = await userdb.get(`${guild.id}/${member.user.id}`);
        let rewards = await readJSON('rewards.json');
        let name = args.join(' ');
        let item, category = null;

        let possibleRewards = await guessRewards(rewards,name,true);

        if(possibleRewards.length == 0){
            return 'There are no rewards with or similar to this name.';
        } else if(possibleRewards.length == 1){
            item = possibleRewards[0];
            category = possibleRewards[0].colour ? 'backgrounds' : possibleRewards[0].category ? 'roles' : 'frames';
            await buyItem(member,guild,item,category,userdata,msg);
        } else if(possibleRewards.length < 10){
            const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
            const embed = new MessageEmbed()
                .setTitle('Similar rewards:')
                .setColor('#AEC6CF')
                .setDescription('Loading...');
            let msg = await message?.channel.send({embed:embed});
            if(!msg) {
                await interaction?.reply(embed);
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
            await msg.edit({embed:embed});
            const collector = await msg.createReactionCollector((reaction, user) => user.id == member.user.id && emojis.includes(reaction.emoji.name) || reaction.emoji.name == '⛔', {time:300000});
            collector.on('collect', async (reaction, user) => {
                if(reaction.emoji.name == '⛔'){
                    if(!message?.deleted && message?.deletable) await message?.delete();
                    if(!msg.deleted && msg.deletable) await msg.delete();
                    collector.stop('cancelled');
                };
                let index = emojis.indexOf(reaction.emoji.name);
                item = await possibleRewards[index];
                category = item.colour ? 'backgrounds' : item.category ? 'roles' : 'frames';
                await reaction.users.remove(user);
                collector.stop('success');
            });
            collector.on('end', async (collected, reason) => {
                if(reason == 'cancelled' || reason == 'time') return;
                await msg.reactions.removeAll();
                await buyItem(member,guild,item,category,userdata,msg);
            });
        } else {
            return `There are too many items (${possibleRewards.length}) with a similar name! Consider being a little more specific.`;
        };
    }
};