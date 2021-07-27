module.exports = {
    name:'maintenance',
    desc:`This is a command regarding maintenance breaks.`,
    usage:'!maintenance',
    noGuild:true,
    execute: async () => {
        return {
            content: `Here's the information about maintenance breaks.\nMaintenance breaks usually happen when a major feature is broken, or when there's a major database error.\nThese kind of errors likely get resolved pretty quickly, and are pretty rare.\nCompensations will occur if user data was affected negatively.`,
            ephemeral: true
        };
    }
};