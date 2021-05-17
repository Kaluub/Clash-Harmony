const {economyLog} = require(`../functions.js`);
const Keyv = require(`keyv`);
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'daily',
    admin:false,
    hidden:true,
    desc:`This is a (probably) satire command regarding daily rewards.`,
    usage:'!daily',
    async execute(message,args){
        let collected = await userdb.get(`${message.guild.id}/GoldenBackgrounds`);
        const userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        if(!collected) collected = 0;
        const messages = [
            `You got absolutely nothing. Try again later!`,
            `...But nothing happened.`,
            `Nobody responds to your begging.`,
            `What is there to gain?`,
            `A response is something that could never happen.`,
            `Only for the worthy.`,
            `Perhaps type harder next time.`,
            `There's a good reason this isn't listed in !help.`,
            `Something you expect might never occur.`,
            `You got a special nothing.`,
            `Why bother continuing? What is there to gain?`,
            `Can't say I didn't warn you.`,
            `You are wasting your precious time.`,
            `Strange. I heard the chance of getting something from this was about zero.`,
            `But nobody came.`,
            `Stop begging, it's futile.`,
            `Even if there is some reward... is it really worth it?`,
            `What do you think it might be? I think it's nothing special.`,
            `Using !profile is probably smarter.`,
            `I have no emotions, which is why I don't care if you waste your time.`,
            `Be educated: This bot was first created on March 17th, 2021.`,
            `So how's your day going?`,
            `The reward from this command has been obtained by ${collected} users in this server, making the current chance ${(0.01/(collected + 1)) * 100}%.`,
            `You first interacted with me at ${new Date(userdata.statistics.age).toUTCString()}... but for what cause?`,
            `You've used ${userdata.statistics.commandsUsed} commands to date... but for what cause?`
        ];
        if(Math.random() <= 0.01 / (collected + 1)){
            if(userdata.unlocked.backgrounds.includes('golden_background')){
                userdata.points += 1;
                userdata.statistics.earned += 1;
                await userdb.set(`${message.guild.id}/${message.author.id}`, userdata);
                economyLog(message.guild.id, message.author, null, 1);
                return message.channel.send(`**LUCKY**: ...Too lucky. You earned 1 point.`);
            };
            userdata.unlocked.backgrounds.push('golden_background');
            userdata.card.background = 'golden_background';
            await userdb.set(`${message.guild.id}/${message.author.id}`, userdata);
            await userdb.set(`${message.guild.id}/GoldenBackgrounds`, collected + 1);
            return message.channel.send(`**LUCKY**: ...But something finally happened.`);
        } else {
            return message.channel.send(messages[Math.floor(Math.random() * messages.length)]);
        };
    }
};