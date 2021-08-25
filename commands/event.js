const {MessageEmbed, MessageButton, MessageActionRow} = require("discord.js");
const Keyv = require('keyv');
const db = new Keyv('sqlite://data/users.sqlite', {namespace:'guilds'});

async function initEvents(client){
    console.log(`Loading events...`);
    await client.guilds.cache.forEach(async guild => {
        const events = await db.get(`${guild.id}/Events`);
        if(!events) return;
        for(const event of events){
            if(Date.now() > event.timestamp) continue;
            if(['artcontest', 'buildcontest'].includes(event.type)) setTimeout(submissionBasedEvent, event.timestamp - Date.now(), client, event);
            if(event.type == 'ama') setTimeout(amaEvent, event.timestamp - Date.now(), client, event);
        };
    });
};

async function submissionBasedEvent(client, event){
    const channel = await client.channels.fetch(event.channelID);
    if(!channel) return;
    const message = await channel.messages.fetch(event.messageID);
    if(!message) return;
    message.embeds[0]?.setDescription('Event over!');
    await message.edit({embed:message.embeds[0]});
};

async function amaEvent(client, event){
    const message = await client.messages.fetch(event.messageID);
    if(!message) return;
    message.embeds[0]?.setDescription('Event over!');
    await message.edit({embed:message.embeds[0]});
};

module.exports = {
    name:'event',
    desc:'A command for starting and managing events.',
    usage:'/event [TODO]',
    admin:true,
    execute: async ({interaction}) => {
        if(!interaction) return `This command can only be used as a slash command.`;

        let events = await db.get(`${interaction.guild.id}/Events`);
        if(!events) {
            events = [];
            await db.set(`${interaction.guild.id}/Events`, events);
        };

        let event = {
            channelID: interaction.channel.id,
            messageID: null,
            name: null,
            id: events.length + 1,
            type: null,
            time: 72,
            timestamp: Date.now() + 259200000,
            points: null
        };

        interaction.options.first().options.forEach((option, name) => {
            if(name == 'name') event.name = option.value;
            if(name == 'type') event.type = option.value;
            if(name == 'length'){event.time = option.value; event.timestamp = Date.now() + (option.value * 3600000)};
            if(name == 'points') event.points = option.value;
            if(name == 'channel') event.channelID = option.channel.id;
            if(name == 'poll-options'){
                event.pollOptions = option.value.split('; ');
                if(event.pollOptions.length > 5) return `There can not be more than 5 options in a poll.`;
                if(event.pollOptions.length < 2) return `There needs to be at least 2 options in a poll.`;
                event.voteCounts = [];
                event.pollOptions.forEach(opt => {
                    if(opt.length > 80) return `An option can only be up to 80 characters long.`;
                    if(opt.length < 1) return `An option needs to be more than 0 characters long.`;
                    event.voteCounts.push(0);
                });
                event.uniqueUserVotes = [];
            };
        });

        const embed = new MessageEmbed()
            .setTitle(`(${event.id}) Event started: ${event.name}`)
            .setAuthor('Clash & Harmony Event', interaction.client.user.displayAvatarURL())
            .addField(`Event number:`, `${event.id}`)
            .addField(`Title:`, `${event.name}`)
            .addField(`Event time:`, event.time > 23 ? `${Math.floor(event.time / 24)} day${Math.floor(event.time) == 1 ? '' : 's'}${event.time % 24 == 0 ? `` : ` ${event.time % 24} hours`}` : `${event.time} hour${event.time % 24 == 1 ? '' : 's'}`)
            .setTimestamp(Date.now() + (event.time * 3600000));
        // Art contest events:
        if(event.type == 'artcontest'){
            embed.setColor(`#D023AE`)
                .addField(`Description:`, `An art contest allows a way for people to submit their own creative works to the clan for use in various forms of media.`)
                .addField(`Rules:`, `The provided art must be related in some format to the theme.\nYou have until the provided time above & below to submit any works should you desire to do so.\nAfter this time, the voting phase begins and users can vote for whoever they feel has the best art submission.\nVoting earns you 15 free points, as an encouragement to do so!\nBy submitting your work through the Bot, you understand that your work may be used by the clan in any way, on any platform.`)
                .addField(`Participation:`, `To participate, you must DM the bot with either a link to the work or attach the image directly, and add the category "event submission".`)
        };
        // Build contest events:
        if(event.type == 'buildcontest'){
            embed.setColor(`#FFA500`)
                .addField(`Description:`, `Build contests test your building capabilities in Pixel Worlds.`)
                .addField(`Rules:`, `The build you provide must be related to the theme in some format.\nYou have until the provided time above & below to submit your build should you desire to do so.\nAfter this time, the voting phase begins and users can vote for whoever they feel has the best build.\nVoting earns you 15 free points, as an encouragement to do so.`)
                .addField(`Participation:`, `To participate, you must DM the bot with either a link to a screenshot of your build or attching the screenshot directly, and add the category "event submission".`)
        };
        // AMA event:
        if(event.type == 'ama'){
            embed.setColor(`#DEA5A4`)
                .addField(`Description:`, `AMA events are special events in which you can ask the host of the event anything you wish to ask.`)
                .addField(`Rules:`, `All questions asked should be reasonably appropriate, otherwise, ask them anything! The host will answer the questions once the time is up.`)
                .addField(`Participation:`, `To participate, you must DM the bot with your question, and add the category "event submission".`)
        };
        // Karaoke event:
        if(event.type == 'karaoke'){
            embed.setColor(`#DEA5A4`)
                .addField(`Description:`, `A Karaoke event is a gathering of members who sing however they feel, usually to a specific song.`)
                .addField(`Participation:`, `To participate, join the Stage channel that starts when the event begins!`)
        };
        // PW event:
        if(event.type == 'pixelworldsevent'){
            embed.setColor(`#77DD77`)
                .addField(`Description:`, `A Pixel Worlds event is a contest in which a challenge in Pixel Worlds is started, whether it be a parkour challenge, wiring contest, fashion contest or even something new.`)
                .addField(`Participation:`, `Participation depends on the content of the event — in most cases, it'll be in a Stage channel, or you'll need to submit work by sending a DM to the bot with the "event submission" category.`)
        };
        // Poll:
        if(event.type == 'poll'){
            embed.setColor(`#AEC6CF`)
                .addField(`Description:`, `A poll! Vote for whichever option you feel is the best.`)
                .addField(`Participation:`, `Use the buttons below to vote for the poll.`)
        };

        // Whether to add the reward here or not.
        if(['artcontest', 'buildcontest'].includes(event.type)) embed.addField(`Reward:`, `The winner(s) of the contest will always receive the <@&801156920106025010> role.${event.points ? `\nFor ths event, the winner(s) will also receive ${event.points} points.` : ``}`);
        else if(event.points) embed.addField(`Reward:`, `The winner(s) will receive ${event.points} points.`);
        
        // Handle ending events:
        let row = new MessageActionRow();
        if(event.pollOptions){
            let n = 0;
            event.pollOptions.forEach(opt => {
                row.addComponents(new MessageButton().setCustomId(`poll-${n}-${event.id}`).setLabel(opt).setStyle('PRIMARY'));
                n += 1;
            });
        } else if(['artcontest', 'buildcontest'].includes(event.type)){
            setTimeout(submissionBasedEvent, event.timestamp - Date.now(), interaction.client, event);
        } else if(event.type == 'ama'){
            setTimeout(amaEvent, event.timestamp - Date.now(), interaction.client, event);
        };

        const channel = await interaction.client.channels.fetch(event.channelID);
        if(!channel.isTest()) return `Invalid channel.`;
        const msg = await channel.send({content: `New event!`, embeds:[embed], components: row.components.length ? [row] : []});
        event.messageID = msg.id;
        events.push(event);
        await db.set(`${interaction.guild.id}/Events`, events);
        return `Your event has been created in ${channel}.`;
    },
    initEvents: initEvents
};