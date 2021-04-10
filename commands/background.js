const Keyv = require('keyv');
const {readJSON} = require('../json.js');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'background',
    aliases:['bg','backg'],
    admin:false,
    hidden:true,
    desc:`This is a command for customizing your profile card's background.`,
    usage:'!background [owned background]',
    async execute(message,args){
        if(!args[0]) return message.channel.send('Usage: ' + this.usage);
        let name = args.join(' ');
        let userdata = await userdb.get(`${message.guild.id}/${message.author.id}`);
        let rewards = await readJSON('rewards.json');
        let background = null;
        for(const i in rewards.rewards.backgrounds){
            let b = rewards.rewards.backgrounds[i];
            if(b.name.toLowerCase() == name.toLowerCase()){
                background = b;
                break;
            };
        };
        if(!background) return message.channel.send('There are no backgrounds with this name.');
        if(!userdata.unlocked.backgrounds.includes(background.id)) return message.channel.send(`You don't own this background. See \`!list backgrounds\` for a list of owned backgrounds.`);
        userdata.card.background = background.id;
        await userdb.set(`${message.guild.id}/${message.author.id}`,userdata);
        return message.channel.send(`Successfully set your active background to ${background.name}.`);
    }
};