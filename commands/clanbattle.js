const { Modal, TextInputComponent, MessageActionRow } = require('discord.js');
const { GuildData } = require('../classes/data.js');
const { readJSON } = require("../json.js");
const Locale = require("../classes/locale.js");
const clanbattle = require('../events/clanbattle.js');

module.exports = {
    name: 'clanbattle',
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
            "description": "Once every hour, you can start a clan battle.",
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
    execute: async ({interaction, userdata}) => {
        if(!interaction) return Locale.text(userdata.settings.locale, "SLASH_COMMAND_ONLY");
        const { admins } = await readJSON('config.json');

        if(interaction.options.getSubcommand(false) == 'test') {
            if(!admins.includes(interaction.user.id) && !userdata.unlocked.features.includes("CLANBATTLE_MANAGER")) return Locale.text(userdata.settings.locale, "PERMISSION_ERROR");
            let channel = interaction.options.getChannel('channel', false);
            if(!channel) channel = interaction.channel;
            await clanbattle.execute({channel: channel, debug: true, ping: false});
            return {content: Locale.text(userdata.settings.locale, "CLANBATTLE_TEST_STARTED", channel)};
        };

        if(interaction.options.getSubcommand(false) == 'start') {
            const data = await GuildData.get(interaction.guild.id);
            if(data.clanBattles.cooldown > Date.now())
                if(!admins.includes(interaction.user.id)) return Locale.text(userdata.settings.locale, "CLANBATTLE_COOLDOWN", Math.floor(data.clanBattles.cooldown / 1000));
            data.clanBattles.cooldown = Date.now() + 3600000;
            await GuildData.set(interaction.guild.id, data);
            let channel = interaction.options.getChannel('channel', false);
            if(!channel) channel = interaction.channel;
            await clanbattle.execute({channel: channel, ping: false});
            return {content: Locale.text(userdata.settings.locale, "CLANBATTLE_STARTED", channel)};
        };

        if(interaction.options.getSubcommandGroup(false) == 'questions') {
            if(!admins.includes(interaction.user.id) && !userdata.unlocked.features.includes("CLANBATTLE_MANAGER")) return Locale.text(userdata.settings.locale, "PERMISSION_ERROR");
            if(interaction.options.getSubcommand(false) == 'add') {
                const modal = new Modal()
                    .setCustomId("clanbattle-add-question")
                    .setTitle(Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_TITLE"))
                
                const questionInput = new TextInputComponent()
                    .setCustomId("question-title")
                    .setLabel(Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_LABEL_1"))
                    .setPlaceholder(Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_PLACEHOLDER_1"))
                    .setMaxLength(128)
                    .setMinLength(4)
                    .setStyle("SHORT")
                    .setRequired(true)
                
                const optionsInput = new TextInputComponent()
                    .setCustomId("question-options")
                    .setLabel(Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_LABEL_2"))
                    .setPlaceholder(Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_PLACEHOLDER_2"))
                    .setStyle("PARAGRAPH")
                    .setRequired(true)
                
                const answerInput = new TextInputComponent()
                    .setCustomId("question-answer")
                    .setLabel(Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_LABEL_3"))
                    .setPlaceholder(Locale.text(userdata.settings.locale, "CLANBATTLE_ADD_QUESTION_PLACEHOLDER_3"))
                    .setMaxLength(1)
                    .setMinLength(1)
                    .setStyle("SHORT")
                    .setRequired(true)
                
                modal.addComponents(
                    new MessageActionRow().addComponents(questionInput),
                    new MessageActionRow().addComponents(optionsInput),
                    new MessageActionRow().addComponents(answerInput)
                );

                return await interaction.showModal(modal);
            } else if(interaction.options.getSubcommand(false) == 'remove') {
                return Locale.text(userdata.settings.locale, "TODO");
            } else return Locale.text(userdata.settings.locale, "HOW_DID_WE_GET_HERE");
        };

        return Locale.text(userdata.settings.locale, "HOW_DID_WE_GET_HERE");
    }
};