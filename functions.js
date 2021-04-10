const {MessageEmbed} = require('discord.js');

async function updateMembers(guild,clan){
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

async function guessRewards(rewards,name,all){
    let possibleRewards = [];
    for(const i in rewards.rewards.frames){
        let f = rewards.rewards.frames[i];
        if(f.name.toLowerCase().includes(name.toLowerCase())){
            possibleRewards.push(f);
        };
    };
    for(const i in rewards.rewards.backgrounds){
        let b = rewards.rewards.backgrounds[i];
        if(b.name.toLowerCase().includes(name.toLowerCase())){
            possibleRewards.push(b);
        };
    };
    if(all){
        for(const i in rewards.rewards.roles){
            let r = rewards.rewards.roles[i];
            if(r.name.toLowerCase().includes(name.toLowerCase())){
                possibleRewards.push(r);
            };
        };
    }
    return possibleRewards;
};

module.exports = {
    updateMembers:updateMembers,
    guessRewards:guessRewards
};