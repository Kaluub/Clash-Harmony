const { MessageEmbed, MessageActionRow, MessageButton, Collection, MessageSelectMenu } = require("discord.js");
const { UserData } = require('../classes/data.js');
const { readJSON } = require('../json.js');
const { randInt } = require('../functions.js');

function randText(arr) {
    return arr[randInt(0, arr.length)];
};

function shuffleArray(arr) {
    let array = new Array(...arr);
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    };
    return array;
};

function getModifier(battleData) {
    let totalWeight = 0;
    for(const modifier of battleData.modifiers) {
        totalWeight += modifier.weight;
    };

    let random = randInt(1, totalWeight + 1);
    for(const modifier of battleData.modifiers) {
        if(random < modifier.weight) return modifier;
        random -= modifier.weight;
    };
};

async function tickBattle({battleData, battle, msg}) {
    const alivePlayers = battle.members.filter(member => member.hp > 0);

    if(alivePlayers.size < battle.modifiers.quizPlayersAllowed) return await tickQuiz(...arguments);
    battle.round += 1;

    if(battle.round == 0) {
        battle.log.push(randText(battleData.messages.battleStarted));
    } else {
        let attacker = await alivePlayers.random();
        let defender = await alivePlayers.filter(p => p.id != attacker.id).random();

        const randomChance = randInt(1, 101);

        let lostHp = battle.modifiers.normalDamage;
        if(randomChance < battle.modifiers.critOdds) {
            lostHp = battle.modifiers.critDamage;
            battle.log.push('✦ ' + randText(battleData.messages.battleCritText).replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username))
        } else if(randomChance < battle.modifiers.missOdds) {
            lostHp = 0;
            battle.log.push('◊ ' + randText(battleData.messages.battleMissText).replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username))
        } else {
            lostHp = battle.modifiers.normalDamage;
            battle.log.push('⚔ ' + randText(battleData.messages.battleHitText).replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username))
        };

        defender.hp -= lostHp;
        battle.log.push(`${defender.username} has ${defender.hp > 0 ? defender.hp : 'no'} health remaining! (-${lostHp})`)
        if(defender.hp < 1) battle.log.push('💀 ' + randText(battleData.messages.battleKillText).replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username));
    };

    const embed = renderBattleEmbed({battle});
    await msg.edit({embeds: [embed]});

    setTimeout(async () => {
        await tickBattle(...arguments);
    }, 1500);
};

function renderBattleEmbed({battle}) {
    return new MessageEmbed()
        .setTitle(`Elimination Clan Battle (${battle.round}):`)
        .setDescription('```\n' + battle.log.slice(-8).join('\n') + '\n```')
        .setColor(battle.colour)
        .setTimestamp();
};

// Quiz:
async function tickQuiz({battleData, battle, msg}) {
    battle.quizRound += 1;
    let answers = 0;
    let fails = 0;
    let responses = [];
    let firstResponder = null;

    const members = battle.members.filter(member => member.hp > 0);
    const data = await handleQuizData({battleData, battle});

    await msg.edit({embeds: [data.embed], components: [data.row]});

    const collector = msg.createMessageComponentCollector({time: battle.modifiers.quizRoundTime});

    collector.on('collect', async int => {
        if(int.customId == 'skip') {
            await int.reply({content: 'Skipped a little'});
            return collector.stop();
        };

        if(!members.has(int.user.id)) return int.reply({content: randText(battleData.messages.notInQuiz), ephemeral: true});
        if(responses.includes(int.user.id)) return int.reply({content: randText(battleData.messages.alreadyRespondedQuiz), ephemeral: true});
        responses.push(int.user.id);
        if(data.shuffledQuiz[parseInt(int.values[0])] == data.answer) {
            const user = battle.members.get(int.user.id);
            let points = (100 - (answers * 5)) * battle.modifiers.quizPointModifier;
            if(points < 50) points = 50;
            user.quizPoints += points;
            answers += 1;
            if(!firstResponder) {
                firstResponder = user.username;
                return int.reply({content: randText(battleData.messages.firstAnswerQuiz).replaceAll("{points}", points.toString()), ephemeral: true});
            } else return int.reply({content: randText(battleData.messages.correctAnswerQuiz).replaceAll("{points}", points.toString()), ephemeral: true});
        } else {
            fails += 1;
            return int.reply({content: randText(battleData.messages.wrongAnswerQuiz), ephemeral: true});
        };
    });

    collector.on('end', async () => {
        if(!msg || !msg.editable) return;
        const embed = new MessageEmbed()
            .setTitle(`Quiz round ${battle.quizRound}!`)
            .setDescription(`The correct answer was:\n${data.answer}\n\n${battle.quizRound < battle.modifiers.quizRounds ? 'The next round will start in 3 seconds!' : 'This was the last round! The results are being finalized...'}\n\n**Stats:**\nFirst answer: ${firstResponder ? firstResponder : 'Nobody!'}\nSuccess percent: ${fails+answers == 0 ? '0' : Math.floor(100*(answers/(fails+answers)))}% (${answers} correct, ${fails} wrong)`)
            .setColor(battle.colour);
        try {
            await msg.edit({embeds: [embed], components: []});
        } catch { return null; }

        if(battle.quizRound < battle.modifiers.quizRounds) setTimeout(async() => await tickQuiz(...arguments), 3000);
        else setTimeout(async() => await endQuiz(...arguments), 3000);
    });
};

async function handleQuizData({battleData, battle}) {
    const data = battleData.questions.filter(q => !battle.questions.includes(q.title))[randInt(0, battleData.questions.filter(q => !battle.questions.includes(q.title)).length)];
    const answer = data.options[data.answer];
    const shuffledQuiz = shuffleArray(data.options);

    battle.questions.push(data.title);

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    let string = `This is the quiz round ${battle.quizRound}! Using the buttons below, choose the correct answer. There will be ${battle.modifiers.quizRounds} rounds, each giving you ${Math.floor(battle.modifiers.quizRoundTime / 1000)} seconds to answer. Good luck!\n\nQuestion: ${data.title}\n\n`;
    let index = 0;

    const menu = new MessageSelectMenu()
        .setPlaceholder('Select the correct answer!')
        .setCustomId('quiz-select');

    for(const options of shuffledQuiz) {
        string = string + `\n${emojis[index]} ${options}`;
        menu.addOptions({label: options, value: index.toString()});
        index += 1;
    };

    const row = new MessageActionRow().setComponents(menu);

    const embed = new MessageEmbed()
        .setTitle(`Quiz round ${battle.quizRound}!`)
        .setDescription(string)
        .setColor(battle.colour)

    return {
        embed: embed,
        row: row,
        answer: answer,
        shuffledQuiz: shuffledQuiz
    };
};

async function endQuiz({battle, msg}) {
    const members = battle.members.filter(member => member.hp > 0);
    let lightPoints = 0;
    let darkPoints = 0;

    members.filter(member => member.faction == 'light').forEach(member => lightPoints += member.quizPoints);
    members.filter(member => member.faction == 'dark').forEach(member => darkPoints += member.quizPoints);

    const topThree = members.sort((user1, user2) => user2.quizPoints - user1.quizPoints).first(3);

    let winningFaction = 'light';
    if(darkPoints == lightPoints) winningFaction = 'both';
    else if(darkPoints > lightPoints) winningFaction = 'dark';

    for(const [key, member] of members) {
        let points = battle.modifiers.freeReward;
        if(member.faction == winningFaction || winningFaction == 'both') points += battle.modifiers.winningFactionReward;
        if(topThree.some(u => u.id == member.id)) points += battle.modifiers.topThreeReward;
        const data = await UserData.get(msg.guild.id, member.id);
        data.addPoints(Math.floor(points * battle.modifiers.rewardModifier));
        if(!battle.debug) await UserData.set(msg.guild.id, member.id, data);
    };

    let topThreeString = ``;
    topThree.forEach(m => {
        topThreeString += `${m.username} with ${m.quizPoints} points!\n`;
    });

    const embed = new MessageEmbed()
        .setTitle(`Clan battle done!`)
        .setDescription(`${winningFaction == 'both' ? `Both factions tied! Everyone will get the ${battle.modifiers.winningFactionReward} point bonus.` : `The ${winningFaction} faction won!`}\nAlongside this, here are the top 3 people:\n${topThreeString}`)
        .setColor(battle.colour)

    await msg.edit({embeds: [embed], components: []});
};

module.exports = {
    id: 'clanbattle',
    hourTimer: 6,
    channel: '962485620297576449',
    async execute({channel, debug = false, ping = true}){
        const battleData = await readJSON('json/clanbattle.json');

        let battle = {
            debug: debug,
            members: new Collection(),
            questions: [],
            log: [],
            round: 0,
            quizRound: 0,
            displayName: "Normal",
            description: "The default set-up.",
            colour: '#552222',
            modifiers: {
                "quizPlayersAllowed": 11,
                "defaultHp": 50,
                "normalDamage": 10,
                "critDamage": 15,
                "critOdds": 10,
                "missOdds": 20,
                "quizRoundTime": 10000,
                "quizPointModifier": 1.0,
                "quizRounds": 10,
                "freeReward": 5,
                "winningFactionReward": 10,
                "topThreeReward": 20,
                "rewardModifier": 1.0
            }
        };

        const mod = getModifier(battleData);
        battle.displayName = mod.displayName;
        battle.description = mod.description;
        battle.colour = mod.colour;
        battle.modifiers = mod.modifiers;

        const embed = new MessageEmbed()
            .setTitle('Clan battle!')
            .setColor(battle.colour)
            .setDescription(`Welcome to the clan battle! Here you'll participate in text-based battles alongside your fellow clanmates, or against them! You'll be rewarded generously... if you live to see the end!\n\nDetails:\nThe elimination round begins if there are more than ${battle.modifiers.quizPlayersAllowed - 1} people! In this round, you'll fight to the death until enough of you remain!\n\nThe quiz round begins when ${battle.modifiers.quizPlayersAllowed - 1} or less people remain! Here, you'll need to be fast to answer trivia questions. First response gets bonus quiz points! Anyone else who answers within ${Math.floor(battle.modifiers.quizRoundTime / 1000)} seconds will still be rewarded.\n\nAt the end of the event, whichever faction has the most combined quiz points will win and earn ${battle.modifiers.winningFactionReward} points as a bonus! The top 3 individual scorers will receive ${battle.modifiers.topThreeReward} on top as well. Everyone gets a free ${battle.modifiers.freeReward} for participation.\n\nSign up using the button below! You've got 1 minute!`)
            .addField('Modifier:', `We'll be using the **${battle.displayName}** rules!\n${battle.description}`)
            .addField('Participants:', '0')
            .setTimestamp();
        
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setLabel('Join the Dark!')
                .setStyle('SECONDARY')
                .setEmoji('🟪')
                .setCustomId('dark'),
            new MessageButton()
                .setLabel('Join the Light!')
                .setStyle('SECONDARY')
                .setEmoji('🟦')
                .setCustomId('light')
        );

        if(debug) row.addComponents(
            new MessageButton()
                .setLabel('add bot user')
                .setCustomId('dud')
                .setStyle('DANGER'),
            new MessageButton()
                .setLabel('skip')
                .setCustomId('skip')
                .setStyle('DANGER'),
            new MessageButton()
                .setLabel('stop')
                .setCustomId('stop')
                .setStyle('DANGER')
        );
        
        let m = {embeds: [embed], components: [row]};
        if(ping) m.content = "<@&847225115765637120>";
        const msg = await channel.send(m);
        const collector = msg.createMessageComponentCollector({time: 60000});

        collector.on('collect', async int => {
            if(int.customId == 'dud') {
                const data = {
                    username: randText(battleData.messages.dudUsernames),
                    id: randInt(1,1000000000),
                    hp: battle.modifiers.defaultHp,
                    maxHp: battle.modifiers.defaultHp,
                    quizPoints: 0,
                    faction: 'light'
                };
                battle.members.set(data.id, data);
                await int.update({embeds: [embed.setFields({name: 'Modifier:', value: `We'll be using the **${battle.displayName}** rules!\n${battle.description}`},{name: 'Participants:', value: battle.members.size.toString()})]});
                await int.followUp({content: `:white_check_mark: Dud user added (${data.username}: ${data.id})`, ephemeral: false});
                return;
            };

            if(int.customId == 'skip') {
                collector.stop();
                return await int.reply(':white_check_mark: Skipped waiting time.')
            };

            if(int.customId == 'stop') {
                collector.stop('force');
                return await int.reply(':white_check_mark: Stopped.');
            };

            if(battle.members.has(int.user.id)) return await int.reply({content: `:x: ${randText(battleData.messages.alreadySignedUp)}`, ephemeral: true});
            const data = {
                username: int.user.username,
                id: int.user.id,
                hp: battle.modifiers.defaultHp,
                maxHp: battle.modifiers.defaultHp,
                quizPoints: 0,
                faction: int.customId
            };
            battle.members.set(int.user.id, data);
            await int.update({embeds: [embed.setFields({name: 'Modifier:', value: `We'll be using the **${battle.displayName}** rules!\n${battle.description}`},{name: 'Participants:', value: battle.members.size.toString()})]});
            await int.followUp({content: `:white_check_mark: ${randText(battleData.messages.signedUp).replaceAll('{faction}', data.faction)}`, ephemeral: true});
        });

        collector.on('end', async (col, reason) => {
            if(!msg || !msg?.editable) return;
            if(reason == 'force') return;
            if(battle.members.size < 2) return await msg.edit({content: `Clan battle summary:\n${randText(battleData.messages.fewJoined)}`, embeds: [], components: []});
            const setUpEmbed = new MessageEmbed()
                .setTitle('Starting soon!')
                .setColor(battle.colour)
                .setDescription(`${battle.members.size.toString()} of you signed up!\nYour clan battle will be starting soon! Stay on your toes!`)
            try {
                await msg.edit({embeds: [setUpEmbed], components: []});
            } catch { return null; }
            setTimeout(async () => {
                await tickBattle({battleData, battle, msg});
            }, 5000);
        });
    }
};