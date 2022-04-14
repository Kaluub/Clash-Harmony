const { readJSON } = require('../json.js');
const { createProfileCard } = require('../functions.js');
const { MessageAttachment } = require('discord.js');
const { UserData } = require('../classes/data.js');

module.exports = {
    name: 'View Profile Card',
    type: 'USER',
    execute: async ({interaction}) => {
        const member = interaction.options.getMember('user');
        if(member.user.bot) return 'That is a bot!';
        
        const rewards = await readJSON('json/rewards.json');
        const userdata = await UserData.get(interaction.guild.id, member.id);
        const buffer = await createProfileCard(member, rewards, userdata);
        const attachment = new MessageAttachment(buffer, 'card.png');
        return {content: `Here is ${member.user.username}'s profile card:`, files: [attachment]};
    }
};