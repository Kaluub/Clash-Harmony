const { UserData } = require('../../classes/data.js');

module.exports = {
    name: 'eco',
    execute: async ({interaction}) => {
        const user = interaction.options.getUser('member');
        const points = interaction.options.getInteger('points');
        const force = interaction.options.getBoolean('force-set', false);
        const userdata = await UserData.get(interaction.guild.id, user.id);
        if(force){
            userdata.setPoints(points);
        } else {
            userdata.addPoints(points);
        };
        await UserData.set(interaction.guild.id, user.id, userdata);
        return force ? `Successfully set ${user.tag} points to ${points}.` : `Successfully added ${points} points to ${user.tag}.`;
    }
};