const { UserData } = require('../../classes/data.js');
const { readJSON } = require('../../json.js');

module.exports = {
    name: 'rewards/remove',
    execute: async ({interaction}) => {
        const member = interaction.options.getMember('member');
        if(member.user.bot) return `You can't remove rewards from a bot.`;

        const userdata = await UserData.get(interaction.guild.id, member.user.id);
        const rewards = await readJSON('json/rewards.json');

        const reward = interaction.options.getString('reward');
        const item = rewards[reward];

        if(!item) return `No reward found with the name \`${reward}\`.`;

        if(item.type == 'frames' || item.type == 'backgrounds'){
            if(!userdata.hasReward(item)) return 'The user does not have this reward.';
            userdata.removeReward(item);
            await UserData.set(interaction.guild.id, member.user.id, userdata);
            return `You removed the ${item.name} from ${member.user.tag}.`;
        } else if(item.type == 'roles'){
            if(interaction.guild.id != '636986136283185172') return 'This reward can only be handled in the Clash & Harmony discord server!';
            if(!userdata.hasReward(item)) return 'The user does not have this reward!';
            userdata.removeReward(item);
            await UserData.set(interaction.guild.id, member.user.id, userdata);
            await member.roles.remove(item.id, `Reward removed by ${interaction.user.tag}.`);
            return `You removed the ${item.name} from ${member.user.tag}.`;
        } else {
            return `There was an error removing this item.`;
        };
    }
};