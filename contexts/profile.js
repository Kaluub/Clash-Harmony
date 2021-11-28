const { readJSON } = require('../json.js');
const { createProfileCard } = require('../functions.js');
const { MessageAttachment } = require('discord.js');
const Data = require('../classes/data.js');

module.exports = {
    name: 'View Profile Card',
    execute: async ({interaction}) => {
        const member = interaction.options.getMember('user');
        if(member.user.bot) return 'That is a bot!';
        
        const rewards = await readJSON('json/rewards.json');
        const userdata = await Data.get(interaction.guild.id, member.id);
        const buffer = await createProfileCard(member, rewards, userdata);
        const attachment = new MessageAttachment(buffer, 'card.png');
        return {content: `Here is ${member.user.username}'s profile card:`, files: [attachment]};
    }
};