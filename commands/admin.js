const { readdirSync } = require('fs');

const functions = new Map();
const files = readdirSync("./commands/admin").filter(file => file.endsWith('.js'));
files.forEach(file => {
    const data = require(`./admin/${file}`);
    if(!data.archived) functions.set(data.name, data);
});

module.exports = {
    name: 'admin',
    desc: 'All administrative commands are held here.',
    usage: '/admin [...]',
    admin: true,
    options: [
        {
            "name": "eco",
            "description": "A command to manage point distribution.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "member",
                    "description": "The member to give the points to.",
                    "type": "USER",
                    "required": true
                },
                {
                    "name": "points",
                    "description": "The amount of points to give this member.",
                    "type": "INTEGER",
                    "required": true
                },
                {
                    "name": "force-set",
                    "description": "Whether the points should be set to the amount or not",
                    "type": "BOOLEAN",
                    "required": false
                }
            ]
        },
        {
            "name": "rewards",
            "description": "Manage the rewards from the shop.",
            "type": "SUB_COMMAND_GROUP",
            "options": [
                {
                    "name": "add",
                    "description": "Add a reward to a user.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "member",
                            "description": "The member to give the reward to.",
                            "type": "USER",
                            "required": true
                        },
                        {
                            "name": "reward",
                            "description": "The reward to give the member.",
                            "type": "STRING",
                            "autocomplete": true,
                            "required": true
                        }
                    ]
                },
                {
                    "name": "remove",
                    "description": "Remove a reward from a user.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "member",
                            "description": "The member to remove the reward from.",
                            "type": "USER",
                            "required": true
                        },
                        {
                            "name": "reward",
                            "description": "The reward to remove from the member.",
                            "type": "STRING",
                            "autocomplete": true,
                            "required": true
                        }
                    ]
                },
                {
                    "name": "create",
                    "description": "Create a new reward.",
                    "type": "SUB_COMMAND"
                }
            ]
        },
        {
            "name": "features",
            "description": "Manage a users features.",
            "type": "SUB_COMMAND_GROUP",
            "options": [
                {
                    "name": "add",
                    "description": "Add a feature to a user.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "member",
                            "description": "The member to give the feature to.",
                            "type": "USER",
                            "required": true
                        },
                        {
                            "name": "feature",
                            "description": "The feature to give the member.",
                            "type": "STRING",
                            "autocomplete": true,
                            "required": true
                        }
                    ]
                },
                {
                    "name": "remove",
                    "description": "Remove a feature from a user.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "member",
                            "description": "The member to remove the feature from.",
                            "type": "USER",
                            "required": true
                        },
                        {
                            "name": "feature",
                            "description": "The feature to remove from the member.",
                            "type": "STRING",
                            "autocomplete": true,
                            "required": true
                        }
                    ]
                }
            ]
        },
        {
            "name": "list",
            "description": "Manage the member lists.",
            "type": "SUB_COMMAND_GROUP",
            "options": [
                {
                    "name": "create",
                    "description": "Create a new member list.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "clan",
                            "description": "The clan of the member list to update.",
                            "type": "STRING",
                            "required": true,
                            "choices": [
                                {
                                    "name": "clash",
                                    "value": "clash"
                                },
                                {
                                    "name": "harmony",
                                    "value": "harmony"
                                }
                            ]
                        },
                        {
                            "name": "main",
                            "description": "Do not use unless it is the main member list.",
                            "type": "BOOLEAN",
                            "required": false
                        }
                    ]
                },
                {
                    "name": "update",
                    "description": "Update the main member list.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "clan",
                            "description": "The clan of the member list to update. If not included, both are updated.",
                            "type": "STRING",
                            "required": false,
                            "choices": [
                                {
                                    "name": "clash",
                                    "value": "clash"
                                },
                                {
                                    "name": "harmony",
                                    "value": "harmony"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "name": "modmail",
            "description": "This command is used to change the mod-mail channel.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "channel",
                    "description": "The channel to use the mod-mail feature in.",
                    "type": "CHANNEL",
                    "channelTypes": ["GUILD_TEXT", "GUILD_NEWS"],
                    "required": true
                }
            ]
        },
        {
            "name": "messages",
            "description": "Manage messages.",
            "type": "SUB_COMMAND_GROUP",
            "options": [
                {
                    "name": "send",
                    "description": "Used to send a message to a channel or user.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "id",
                            "description": "The channel/user ID to send a message to.",
                            "type": "STRING",
                            "required": true
                        },
                        {
                            "name": "content",
                            "description": "The content to use for the message.",
                            "type": "STRING",
                            "required": true
                        },
                        {
                            "name": "links",
                            "description": "Up to 5 links can be included as buttons. Format: 'title,url;title2,url2'.",
                            "type": "STRING",
                            "required": false
                        },
                        {
                            "name": "hide-response",
                            "description": "Whether or not to hide the response.",
                            "type": "BOOLEAN",
                            "required": false
                        }
                    ]
                },
                {
                    "name": "edit",
                    "description": "Used to edit any previously sent message.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "channel",
                            "description": "The channel where the message is stored.",
                            "type": "CHANNEL",
                            "channelTypes": ["GUILD_TEXT", "GUILD_NEWS"],
                            "required": true
                        },
                        {
                            "name": "message-id",
                            "description": "The message ID of the message to edit.",
                            "type": "STRING",
                            "required": true
                        },
                        {
                            "name": "content",
                            "description": "The content to use for the edited message.",
                            "type": "STRING",
                            "required": true
                        }
                    ]
                }
            ]
        },
        {
            "name": "logs",
            "description": "Manage messages.",
            "type": "SUB_COMMAND_GROUP",
            "options": [
                {
                    "name": "usage",
                    "description": "View & filter the usage logs.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "guild-id",
                            "description": "Guild ID to filter for.",
                            "type": "STRING",
                            "required": false
                        },
                        {
                            "name": "channel-id",
                            "description": "Channel ID to filter for.",
                            "type": "STRING",
                            "required": false
                        },
                        {
                            "name": "user-id",
                            "description": "User ID to filter for.",
                            "type": "STRING",
                            "required": false
                        },
                        {
                            "name": "action-name",
                            "description": "Action (or command) name to filter for.",
                            "type": "STRING",
                            "required": false
                        }
                    ]
                },
                {
                    "name": "status",
                    "description": "View & filter the status logs.",
                    "type": "SUB_COMMAND",
                    "options": [
                        {
                            "name": "timestamp",
                            "description": "Timestamp to filter for.",
                            "type": "STRING",
                            "required": false
                        },
                        {
                            "name": "type",
                            "description": "Status type to filter for.",
                            "type": "STRING",
                            "required": false
                        }
                    ]
                }
            ]
        },
        {
            "name": "block",
            "description": "Block or unblock a user from using the bot.",
            "type": "SUB_COMMAND",
            "options": [
                {
                    "name": "member",
                    "description": "The member to block from using the bot.",
                    "type": "USER",
                    "required": true
                }
            ]
        }
    ],
    execute: async ({interaction, userdata}) => {
        if(!interaction) return;
        const group = interaction.options.getSubcommandGroup(false);
        const subCommand = interaction.options.getSubcommand(false);
        const cmd = functions.get(`${group ? group + '/' : ''}${subCommand}`);
        if(!cmd) return `Something must have gone wrong, because this isn't a command!`;
        return await cmd.execute({interaction, userdata}); // Make sure to return a valid message!
    }
};