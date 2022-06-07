const { UserData } = require('../../classes/data.js');
const { readJSON } = require('../../json.js');

module.exports = {
    name: 'features/remove',
    execute: async ({interaction}) => {
        const member = interaction.options.getMember('member');
        if(member.user.bot) return `You can't add features to a bot.`;

        const userdata = await UserData.get(interaction.guild.id, member.user.id);
        const features = await readJSON('json/features.json');

        const f = interaction.options.getString('feature');
        const feature = features[f];

        if(!feature) return `No feature found with the name \`${reward}\`.`;
        if(!userdata.unlocked.features.includes(f)) return `This user doesn't have this feature.`;
        userdata.unlocked.features.filter(r => r != f);
        await UserData.set(interaction.guild.id, member.user.id, userdata);
        return `Successfully removed the ${feature.name} feature from ${member.user.tag}.`;
    }
};