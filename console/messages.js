module.exports = {
    name: 'messages',
    usage: 'messages [channel ID]',
    async execute({client, args}){
        if(!args[0]) return console.log('Usage: ' + module.exports.usage);
        const channel = client.channels.cache.get(args[0]);
        if(!channel?.messages) return console.log('That is not a channel, or is it not a text channel!');
        const messages = await channel.messages.fetch();
        messages.sort((m1, m2) => m1.createdAt - m2.createdAt);
        messages.forEach(m => console.log(`[${new Date(m.createdAt).toLocaleString()}] ${m.author.tag} [${m.id}]: ${m.content}`));
    }
};