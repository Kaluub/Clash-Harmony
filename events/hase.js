module.exports = {
    id: 'hase',
    cronTime: "1 0 0 * * *",
    channel: '649270949023055873',
    async execute({channel}){
        await channel.send("<@293066709324267521> daily reminder")
    }
}