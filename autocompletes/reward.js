const { readJSON } = require('../json.js');

module.exports = {
    name: "reward",
    execute: async ({interaction}) => {
        const value = interaction.options.getFocused();
        const rewards = readJSON('json/rewards.json');
        const choices = [];
        for(const index in rewards) {
            if(choices.length > 24) break;
            const reward = rewards[index];
            if(reward.name.toLowerCase().startsWith(value.toLowerCase())) choices.push({name: reward.name, value: reward.id});
        };
        return choices;
    }
}