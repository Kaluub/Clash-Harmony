const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { GuildData } = require('../classes/data.js');

module.exports = {
    name: 'event',
    desc: 'A command for starting and managing events.',
    usage: '/event [TODO]',
    admin: true,
    options: [
        {
            "name": "create",
            "description": "A command to create & start an event.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "name",
                    "description": "The name/theme of the event.",
                    "type": "STRING",
                    "required": true
                },
                {
                    "name": "type",
                    "description": "The type of the event.",
                    "type": "STRING",
                    "required": true,
                    "choices": [
                        {
                            "name": "Art Contest",
                            "value": "artcontest"
                        },
                        {
                            "name": "Build Contest",
                            "value": "buildcontest"
                        },
                        {
                            "name": "AMA Event",
                            "value": "ama"
                        },
                        {
                            "name": "Karaoke Event",
                            "value": "karaoke"
                        },
                        {
                            "name": "PW Game Event",
                            "value": "pixelworldsevent"
                        },
                        {
                            "name": "Poll",
                            "value": "poll"
                        }
                    ]
                },
                {
                    "name": "channel",
                    "description": "The channel to post the event message in. If none is provided, the current channel is used.",
                    "type": "CHANNEL",
                    "required": false
                },
                {
                    "name": "length",
                    "description": "The length of the event, in hours. If not provided, it'll default to 3 days.",
                    "type": "INTEGER",
                    "required": false
                },
                {
                    "name": "points",
                    "description": "The reward of the event.",
                    "type": "INTEGER",
                    "required": false
                },
                {
                    "name": "poll-options",
                    "description": "The options of a poll event, if applicable. Example: 'Option 1; Option 2; Option 3'. Max 5 options.",
                    "type": "STRING",
                    "required": false
                }
            ]
        }
    ],
    execute: async ({interaction}) => {
        if(!interaction) return `This command can only be used as a slash command.`;

        const data = await GuildData.get(interaction.guild.id);

        let event = {
            id: data.events.length + 1,
            channelID: interaction.channel.id,
            messageID: null,
            name: null,
            type: null,
            time: 72,
            timestamp: Date.now() + 259200000,
            points: null
        };

        if(interaction.options.getSubcommand() == "create") {
            interaction.options.data.forEach(option => {
                if(option.name == 'name') event.name = option.value;
                if(option.name == 'type') event.type = option.value;
                if(option.name == 'length') {event.time = option.value; event.timestamp = Date.now() + (option.value * 3600000)};
                if(option.name == 'points') event.points = option.value;
                if(option.name == 'channel') event.channelID = option.channel.id;
                if(option.name == 'poll-options'){
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

            const channel = await interaction.client.channels.fetch(event.channelID);
            if(!channel.isText()) return `Invalid channel.`;

            const scheduledEvent = {
                name: event.name,
                scheduledStartTime: Date.now(),
            }

            const embed = new MessageEmbed()
                .setTitle(`(${event.id}) Event started: ${event.name}`)
                .setAuthor({name: 'Clash & Harmony Event', iconURL: interaction.client.user.displayAvatarURL()})
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
            if(['artcontest', 'buildcontest'].includes(event.type)) embed.addField(`Reward:`, `The winner(s) of the contest will receive the <@&801156920106025010> role.${event.points ? `\nFor ths event, the winner(s) will also receive ${event.points} points.` : ``}`);
            else if(event.points) embed.addField(`Reward:`, `The winner(s) will receive ${event.points} points.`);
            

            // Handle event set-up:
            let row = new MessageActionRow();
            if(event.type == 'poll' && event.pollOptions){
                let n = 0;
                event.pollOptions.forEach(opt => {
                    row.addComponents(new MessageButton().setCustomId(`poll-${n}-${event.id}`).setLabel(opt).setStyle('PRIMARY'));
                    n += 1;
                });
            };

            const msg = await channel.send({embeds: [embed], components: row.components.length ? [row] : []});
            event.messageID = msg.id;
            data.events.push(event);
            await GuildData.set(interaction.guild.id, data);
            return `Your event has been created in ${channel}.`;
        };
    },
};