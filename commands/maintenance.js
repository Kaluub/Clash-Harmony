module.exports = {
    name:'maintenance',
    admin:false,
    hidden:true,
    desc:`This is a command regarding maintenance breaks.`,
    usage:'!daily',
    async execute(message,args){
        return message.channel.send(`Here's the information about maintenance breaks.\nMaintenance breaks usually happen when a major feature is broken, or when there's a major database error.\nThese kind of errors likely get resolved pretty quickly, and are pretty rare.\nCompensations will occur if user data was affected negatively.`);
    }
};