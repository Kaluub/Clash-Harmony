module.exports = {
    name:'send',
    aliases:['s'],
    usage:'send [user ID] [message]',
    async execute(client,args){
        if(!args[0] || !args[1]) return console.log("\x1b[32m%s\x1b[0m",'Usage: ' + this.usage);
        let user;
        try{
            user = await client.users.fetch(args[0]);
        } catch {
            return console.log("\x1b[32m%s\x1b[0m",'Invalid user ID provided.');
        };
        if(!user) return console.log("\x1b[32m%s\x1b[0m",'Invalid user ID provided.');
        args.shift();
        let message = args.join(' ');
        try{
            await user.send(message);
        } catch {
            return console.log("\x1b[32m%s\x1b[0m",`Couldn't send a message to ${user.tag}.`);
        };
        return console.log("\x1b[32m%s\x1b[0m",`Successfully sent your message to ${user.tag}.`);
    }
};