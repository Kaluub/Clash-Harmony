const Data = require('../classes/data.js');

function fix(num){
    return Math.floor(num / 1000)
};

module.exports = {
    name: 'Info',
    execute: async ({interaction}) => {
        const member = interaction.options.getMember('user');
        const user = interaction.options.getUser('user');
        const userdata = await Data.get(interaction.guild.id, user.id);

        const content = `Here is some data regarding ${user?.tag}:\n\nID: ${user?.id}\nJoined Discord: <t:${fix(user?.createdTimestamp)}> (<t:${fix(user?.createdTimestamp)}:R>)\nJoined server: <t:${fix(member?.joinedTimestamp)}> (<t:${fix(member?.joinedTimestamp)}:R>)\n\nRestricted: ${userdata.blocked ? 'Yes' : 'No'}\nPoints: ${userdata.points}\nStatus: \`${userdata.status}\`\nMonthly cooldown: <t:${fix(userdata.monthlyCooldown)}> (<t:${fix(userdata.monthlyCooldown)}:R>)`;
        return {content, ephemeral: true};
    }
};