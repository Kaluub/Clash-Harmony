const { readJSON } = require('../json.js');

module.exports = {
    name: "feature",
    execute: async ({interaction}) => {
        const value = interaction.options.getFocused();
        const features = readJSON('json/features.json');
        const choices = [];
        for(const index in features) {
            if(choices.length > 24) break;
            const feature = features[index];
            if(feature.name.toLowerCase().startsWith(value.toLowerCase())) choices.push({name: feature.name, value: feature.id});
        };
        return choices;
    }
}