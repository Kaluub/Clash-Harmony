module.exports = {
    name: 'channels',
    usage: 'channels [channel name]',
    async execute({client, args}){
        const channels = await client.channels.cache.filter(c => args.length ? c.name.includes(args[0]) : true);
        channels.forEach(c => console.log(`${c.name} [${c.guild.name}]: ${c.id}`));
    }
};