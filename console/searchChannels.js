module.exports = {
    name: 'channels',
    usage: 'channels [channel name]',
    async execute({client, args}){
        const channels = await client.channels.cache.filter(c => args.length ? c?.name ? c.name.includes(args.join(" ").toLowerCase()) : false : true);
        channels.forEach(c => {
            if(!c) return;
            if(c.type == "DM" || c.type == "GUILD_DM") return console.log(`Direct message [${c.recipient.tag}]: ${c.id}`);
            console.log(`${c.name} [${c.guild.name}]: ${c.id}`)
        });
    }
};