const {readJSON} = require('../json.js');
const {MessageEmbed} = require('discord.js');
const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'shop',
    aliases:['s'],
    admin:false,
    desc:'This is a command for displaying the shop.',
    usage:'!shop',
    async execute(message,args){
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        let shop = await readJSON('rewards.json');
        let embed = new MessageEmbed()
            .setColor('#33AA33')
            .setTitle('Shop Interface')
            .setDescription(`You have ${userdata.points} points.\nBelow is a list of all the items available currently:`)
            .setTimestamp();
        embed.setDescription(embed.description + '\n\n**Backgrounds**:');
        for(const i in shop.rewards.backgrounds){
            let background = shop.rewards.backgrounds[i];
            if(!background.shown || !background.name) continue;
            embed.setDescription(embed.description + `\n${background.name} (${background.price} points)`);
        };
        embed.setDescription(embed.description + '\n\n**Frames**:');
        for(const i in shop.rewards.frames){
            let frame = shop.rewards.frames[i];
            if(!frame.shown || !frame.name) continue;
            embed.setDescription(embed.description + `\n${frame.name} (${frame.price} points)`);
        };
        embed.setDescription(embed.description + '\n\n**Roles**:');
        for(const i in shop.rewards.roles){
            let role = shop.rewards.roles[i];
            if(!role.shown || !role.name) continue;
            embed.setDescription(embed.description + `\n${role.name} (${role.price} points)`);
        };
        embed.setDescription(embed.description + '\n\nTo buy a reward, use `!buy [reward name]`.');
        return message.channel.send(embed);
    }
};