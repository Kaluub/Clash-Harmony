const { MessageEmbed } = require('discord.js');
const {guessRewards, economyLog} = require('../functions.js');
const Keyv = require('keyv');
const { readJSON } = require('../json');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

async function buyItem(message,item,category,userdata){
    if(!message || !item || !category || !userdata) return message.channel.send('No rewards found.');
    if(item.endTime && item.endTime < Date.now()) return message.channel.send(`This reward is not available right now!`);
    if(item.startTime && item.startTime > Date.now()) return message.channel.send(`This reward is not available right now!`);

    let discount = 0; // Price booster
    if(userdata.unlocked.features.includes('DISCOUNT_50')) discount += 0.5;
    else if(userdata.unlocked.features.includes('DISCOUNT_25')) discount += 0.25;
    else if(userdata.unlocked.features.includes('DISCOUNT_10')) discount += 0.1;
    if(discount > 1) discount = 1;

    if(category == 'frames' || category == 'backgrounds'){
        if(userdata.unlocked[category].includes(item.id)) return message.channel.send('You already have this reward!');
        if(userdata.points < Math.floor(item.price - item.price * discount)) return message.channel.send(`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`);
        userdata.unlocked[category].push(item.id);
        userdata.points -= Math.floor(item.price - item.price * discount);
        userdata.statistics.spent += item.price;
        await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
        economyLog(message.guild.id, message.author, item);
        return message.channel.send(`You purchased the ${item.name} for ${Math.floor(item.price - item.price * discount)} points.`);
    } else if(category == 'roles'){
        if(message.guild.id != '636986136283185172') return message.channel.send('This reward can only be claimed in the Clash & Harmony Discord server!');
        if(message.member.roles.cache.has(item.id)) return message.channel.send('You already have this reward!');
        if(userdata.points < Math.floor(item.price - item.price * discount)) return message.channel.send(`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`);
        userdata.points -= Math.floor(item.price - item.price * discount);
        userdata.statistics.spent += item.price;
        await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
        await message.member.roles.add(item.id,'Delivering purchase reward.');
        economyLog(message.guild.id, message.author, item);
        return message.channel.send(`You purchased the ${item.name} for ${Math.floor(item.price - item.price * discount)} points.`);
    } else if(category == 'services'){
        if(userdata.points < Math.floor(item.price - item.price * discount)) return message.channel.send(`You don't have enough points to purchase this reward (${item.price - userdata.points} more needed).`);
        userdata.points -= Math.floor(item.price - item.price * discount);
        userdata.statistics.spent += item.price;
        await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
        const LMO = await message.client.users.fetch('186459664974741504');
        const embed = new MessageEmbed().setTimestamp().setTitle('Service requested:').setDescription(`${message.author} (${message.author.tag}):\nThis user has ordered the "${item.name}" service for ${item.price} points.`)
        await LMO.send(embed);
        economyLog(message.guild.id, message.author, item);
        return message.channel.send(`You purchased the ${item.name} for ${Math.floor(item.price - item.price * discount)} points.`);
    } else {
        return message.channel.send(`There was an error purchasing this item.`);
    };
}

module.exports = {
    name:'buy',
    aliases:['b'],
    admin:false,
    desc:'This command is used to purchase rewards from the shop.',
    usage:'!buy [reward name]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        let rewards = await readJSON('rewards.json');
        let name = args.join(' ');
        let item, category = null;

        let possibleRewards = await guessRewards(rewards,name,true);

        if(possibleRewards.length == 0){
            return message.channel.send('There are no rewards with or similar to this name.');
        } else if(possibleRewards.length == 1){
            item = possibleRewards[0];
            category = possibleRewards[0].colour ? 'backgrounds' : possibleRewards[0].category ? 'roles' : 'frames';
            await buyItem(message,item,category,userdata);
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
                embed.setDescription(embed.description + `\n${emojis[index]}: ${reward.name} (${reward.price} points)`);
                await msg.react(emojis[index]);
            };
            await msg.react('⛔');
            await msg.edit({embed:embed});
            const collector = await msg.createReactionCollector((reaction, user) => user.id == message.author.id && emojis.includes(reaction.emoji.name) || reaction.emoji.name == '⛔', {time:300000});
            collector.on('collect', async (reaction, user) => {
                if(reaction.emoji.name == '⛔'){
                    if(!message.deleted && message.deletable) message.delete();
                    if(!msg.deleted && msg.deletable) msg.delete();
                    return collector.stop('cancelled');
                };
                let index = emojis.indexOf(reaction.emoji.name);
                item = await possibleRewards[index];
                category = item.colour ? 'backgrounds' : item.category ? 'roles' : 'frames';
                if(!msg.deleted && msg.deletable) msg.delete();
                return collector.stop('success');
            });
            collector.on('end', async (collected, reason) => {
                if(reason == 'cancelled' || reason == 'time') return;
                await buyItem(message,item,category,userdata);
            })
        } else {
            return message.channel.send(`There are too many items (${possibleRewards.length}) with a similar name! Consider being a little more specific.`);
        };
    }
};