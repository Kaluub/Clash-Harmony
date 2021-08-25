const {MessageEmbed, MessageActionRow} = require('discord.js');
const {readFileSync, writeFileSync} = require('fs');

// Utility function for updating the member list for both clans.
async function updateMembers(guild, clan){
    if(guild.id != '636986136283185172') return;
    await guild.members.fetch();
    let leaderRole = await guild.roles.cache.get('637252689763368960');
    let coLeaderRole = await guild.roles.cache.get(clan == 'clash' ? '636987868874670100' : '813850172219326484');
    let elderRole = await guild.roles.cache.get(clan == 'clash' ? '644620634575601714' : '813849026343600235');
    let veteranRole = await guild.roles.cache.get(clan == 'clash' ? '644620616669986817' : '813848188741353492');
    let memberRole = await guild.roles.cache.get(clan == 'clash' ? '644846211429433344' : '813847814412042280');

    let embed = new MessageEmbed()
        .setColor(clan == 'clash' ? '#00AA00' : '#DA70D6')
        .setTitle(`${clan == 'clash' ? 'Clash' : 'Harmony'} Clan members:`)
        .setDescription(`Below is a list of every member in the ${clan == 'clash' ? 'Clash' : 'Harmony'} Clan.`)
        .setFooter('Last updated')
        .setTimestamp();

    let leaders = [];
    await leaderRole.members.each(async member => leaders.push(`${member}`));
    let leadersText = leaders.join('; ');
    embed.addField('Leader:',`${leadersText.length > 0 ? leadersText : 'N/A'}`);

    let coLeaders = [];
    await coLeaderRole.members.each(async member => coLeaders.push(`${member}`));
    let coLeadersText = coLeaders.join('; ');
    embed.addField('Co-Leaders:',`${coLeadersText.length > 0 ? coLeadersText : 'N/A'}`);

    let elders = [];
    await elderRole.members.each(async member => elders.push(`${member}`));
    let eldersText = elders.join('; ');
    embed.addField('Elders:',`${eldersText.length > 0 ? eldersText : 'N/A'}`);

    let veterans = [];
    await veteranRole.members.each(async member => veterans.push(`${member}`));
    let veteransText = veterans.join('; ');
    embed.addField('Veterans:',`${veteransText.length > 0 ? veteransText : 'N/A'}`);
    
    let members = [];
    await memberRole.members.each(async member => members.push(`${member}`));
    let membersText = members.join('; ');
    embed.addField('Members:',`${membersText.length > 0 ? membersText : 'N/A'}`);

    return embed;
};

// Utility function for "guessing" a reward based on its name
async function guessRewards(rewards, name, roles){
    const possibleRewards = [];
    for(const item of rewards){
        if(item.type == 'roles' && !roles) continue;
        if(item.name.toLowerCase().includes(name.toLowerCase())) possibleRewards.push(item);
    };
    return possibleRewards;
};

// Logging function when any economy-affecting action occurs (adding an item, earning points, etc.)
function economyLog(guildID, user, reward, points, user2){
    let time = new Date(Date.now());
    let str;
    if(!reward){
        str = `\n[ECO] [GUILD: ${guildID}] ${user.id} earned ${points} points${user2 ? ` from ${user2.id}` : ``}. Time: ${time.getDate()}/${time.getMonth()}/${time.getFullYear()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
    } else {
        str = `\n[REWARD] [GUILD: ${guildID}] ${user.id} purchased ${reward.id} for ${reward.price} points. Time: ${time.getDate()}/${time.getMonth()}/${time.getFullYear()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
    };
    let currentLog = readFileSync(`./data/logs/economy.log`, {encoding:'utf-8'});
    currentLog += str;
    writeFileSync(`./data/logs/economy.log`, currentLog, {encoding:'utf-8'});
};

// Logging function. Not used much right now.
function resetLog(guildID, userID, user2ID, userdata, userdata2){
    let time = new Date(Date.now());
    let str = `[TIME: ${time.getDate()}/${time.getMonth()}/${time.getFullYear()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}]\n[${guildID}/${userID}] ${JSON.stringify(userdata)}\n[${guildID}/${user2ID}] ${JSON.stringify(userdata2)}\n=====`;
    let currentLog = readFileSync(`./data/logs/reset.log`, {encoding:'utf-8'});
    currentLog += str;
    writeFileSync(`./data/logs/reset.log`, currentLog, {encoding:'utf-8'});
};

// Updates a suggestion embed (used multiple times, so a function helped)
async function updateSuggestion(data, message){
    const net = data.positive - data.negative;
    let color = '#222277';
    if(net > 9) color = '#55FF55';
    else if(net > 2) color = '#22BB22';
    else if(net < -2) color = '#BB2222';
    else if(net < -9) color = '#FF5555';

    const fields = [{name: 'Rating:', value: `${data.positive} positive ratings\n${data.negative} negative ratings\n${data.voters.length} voter(s)`}];
    if(data.notes?.length){
        let string = ``;
        for(const note of data.notes){
            string += `${note}\n\n`;
        };
        if(string.length > 1000) string = string.slice(0, 1000) + `...`;
        fields.push({name: 'Notes:', value: string});
    };
    if(data.staffnote?.length) fields.push({name: `❗ Staff note: <t:${data.staffnoteTime}> ❗`, value: data.staffnote});
    await message.edit({components: [
        new MessageActionRow(message.components[0])
    ], embeds: [
        new MessageEmbed(message.embeds[0])
            .setFields(fields)
            .setColor(color)
    ]});
};

// Helper for random integer between 2 specific values
function randInt(min = 0, max = 1){
    return Math.floor(Math.random() * (max - min)) + min;
};

module.exports = {
    updateMembers,
    guessRewards,
    economyLog,
    resetLog,
    updateSuggestion,
    randInt
};