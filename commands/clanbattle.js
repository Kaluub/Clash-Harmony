const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, MessageAttachment } = require('discord.js');
const { readJSON, writeJSON } = require('../json.js');
const cd =  require('../events/clanbattle.js');

module.exports = {
    name: 'clanbattle',
    admin: true,
    desc: 'Command used to manage clan battles.',
    usage: '/clanbattle [test/start/questions]',
    options: [
        {
            "name": "test",
            "description": "Test a clan battle. Includes debug tools.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "channel",
                    "description": "The text channel to use.",
                    "type": "CHANNEL",
                    "channelTypes": ["GUILD_TEXT", "GUILD_NEWS"],
                    "required": false
                }
            ]
        },
        {
            "name": "start",
            "description": "Run a clan battle.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "channel",
                    "description": "The text channel to use.",
                    "type": "CHANNEL",
                    "channelTypes": ["GUILD_TEXT", "GUILD_NEWS"],
                    "required": false
                }
            ]
        },
        {
            "name": "questions",
            "description": "The questions used in the clan battle.",
            "type": "SUB_COMMAND_GROUP",
            "options": [
                {
                    "name": "add",
                    "description": "Add a new question.",
                    "type": "SUB_COMMAND",
                },
                {
                    "name": "remove",
                    "description": "Remove an older question.",
                    "type": "SUB_COMMAND"
                }
            ]
        }
    ],
    execute: async ({interaction}) => {
        if(!interaction) return `This command can only be used as an interaction!`;

        if(interaction.options.getSubcommand(false) == 'test') {
            let channel = interaction.options.getChannel('channel', false);
            if(!channel) channel = interaction.channel;
            await cd.execute({channel: channel, debug: true});
            return {content: `Started a test battle in ${channel}!`};
        };

        if(interaction.options.getSubcommand(false) == 'start') {
            let channel = interaction.options.getChannel('channel', false);
            if(!channel) channel = interaction.channel;
            await cd.execute({channel: channel});
            return {content: `Started a clan battle in ${channel}!`};
        };

        if(interaction.options.getSubcommandGroup(false) == 'questions') {
            if(interaction.options.getSubcommand(false) == 'add') {
                let question = {
                    title: "",
                    answer: -1,
                    options: []
                };

                const embed = new MessageEmbed()
                    .setColor('#22BB55')
                    .setTitle('Add a new question!')
                    .setDescription('This is the question builder.\n\nCould you type the question you\'d like to add? You\'ve got 2 minutes.')
                    .setTimestamp();
                
                const reply = await interaction.reply({embeds: [embed], fetchReply: true});

                const collector1 = interaction.channel.createMessageCollector({filter: m => m.author.id == interaction.user.id, time: 120000});
                collector1.on('collect', async m => {
                    question.title = m.content.trim();
                    embed.addField('Title:', question.title).setDescription('This is the question builder.\n\nCould you now type all the options? Seperate them using a new line. Make sure there is only 1 correct answer! Similarily, you have 2 minutes!').setTimestamp();
                    await interaction.editReply({embeds: [embed]});
                    await m.delete();
                    collector1.stop('step1done');
                });

                collector1.on('end', async (col, reason) => {
                    if(reason == 'step1done') {
                        const collector2 = interaction.channel.createMessageCollector({filter: m => m.author.id == interaction.user.id, time: 120000});
                        collector2.on('collect', async m => {
                            const options = m.content.split('\n');
                            if(options.length < 2 || options.length > 9) {
                                await m.channel.send('You need at least:\n - more than 2 options\n - less than 10 options');
                                return await m.delete();
                            };
                            question.options = options;
                            embed.addField('Options:', options.join('\n')).setDescription('This is the question builder.\n\nPlease select which is the correct answer!')
                            const menu = new MessageSelectMenu().setCustomId('correct-options').setPlaceholder('Which is the correct option?');
                            let index = 0;
                            for(const option of options) {
                                menu.addOptions({label: option, value: index.toString()});
                                index += 1;
                            };
                            const row = new MessageActionRow().addComponents(menu);
                            await interaction.editReply({embeds: [embed], components: [row]});
                            await m.delete();
                            collector2.stop('step2done');
                        });

                        collector2.on('end', async (col, reason) => {
                            if(reason == 'step2done') {
                                const collector3 = reply.createMessageComponentCollector({filter: int => int.user.id == interaction.user.id, time: 60000});
                                
                                collector3.on('collect', async int => {
                                    question.answer = parseInt(int.values[0]);
                                    embed.addField('Answer:', question.options[question.answer]).setDescription('This is the question builder.\n\nMake sure all the data below is correct! If so, you can press the "Done" button add the question will be added. You\'ve got 1 minute.').setTimestamp();
                                    const row = new MessageActionRow().addComponents(new MessageButton().setCustomId('done').setLabel('Done!').setStyle('SUCCESS'), new MessageButton().setCustomId('cancel').setLabel('Cancel').setStyle('DANGER'));
                                    await int.update({embeds: [embed], components: [row]});
                                    return collector3.stop('step3done');
                                });

                                collector3.on('end', async (col, reason) => {
                                    if(reason == 'step3done') {
                                        const collector4 = reply.createMessageComponentCollector({filter: int => int.user.id == interaction.user.id, time: 60000});
                                        
                                        collector4.on('collect', async int => {
                                            if(int.customId == 'done') {
                                                embed.setDescription('Done! Here\'s the question you added. To avoid accidental corruption, the file before your question was added was included.');
                                                let json = readJSON('json/clanbattle.json');
                                                const attachment = new MessageAttachment(Buffer.from(JSON.stringify(json, null, 4)), 'clanbattle.json');
                                                json.questions.push(question);
                                                writeJSON('json/clanbattle.json', json);
                                                await int.update({embeds: [embed], files: [attachment], components: []});
                                                return collector4.stop('step4done');
                                            };

                                            if(int.customId == 'cancel') {
                                                await int.update({embeds: [], components: [], content: 'Cancelled.'});
                                                return collector4.stop('cancelled');
                                            };
                                        });

                                        collector4.on('end', async (col, reason) => {
                                            if(reason != 'step4done' && reason != 'cancelled')
                                                await interaction.editReply({content: "Time's up!", embeds: [], components: []});
                                        });
                                    } else {
                                        await interaction.editReply({content: "Time's up!", embeds: [], components: []});
                                    };
                                });
                            } else {
                                await interaction.editReply({content: "Time's up!", embeds: [], components: []});
                            };
                        });
                    } else {
                        await interaction.editReply({content: "Time's up!", embeds: [], components: []});
                    };
                });

            } else if(interaction.options.getSubcommand(false) == 'remove') {
                return 'Will get to this later, probably!';
            } else return 'How did you get here?';
        };

        return 'How did you get here?';
    }
};