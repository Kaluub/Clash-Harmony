const { MessageEmbed, MessageActionRow, MessageButton, Collection } = require("discord.js");
const Data = require('../classes/data.js');
const { readJSON } = require('../json.js');
const { randInt } = require('../functions.js');

function randText(arr) {
    return arr[randInt(0, arr.length)];
};

function shuffleArray(arr) {
    let array = new Array(...arr)
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    };
    return array;
};

async function tickBattle({battleData, battle, msg}) {
    const alivePlayers = battle.members.filter(member => member.hp > 0);

    if(alivePlayers.size < 11) return await tickQuiz(...arguments);
    battle.round += 1;

    if(battle.round == 0) {
        battle.log.push(randText(battleData.messages.battleStarted));
    } else {
        let attacker = await alivePlayers.random();
        let defender = await alivePlayers.filter(p => p.id != attacker.id).random();

        const randomChance = randInt(1, 6);

        let lostHp = 8;
        if(randomChance < 4) {
            lostHp = 8;
            battle.log.push('⚔ ' + randText(battleData.messages.battleHitText).replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username))
        } else if(randomChance < 5) {
            lostHp = 12;
            battle.log.push('✦ ' + randText(battleData.messages.battleCritText).replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username))
        } else {
            lostHp = 0;
            battle.log.push('◊ ' + randText(battleData.messages.battleMissText).replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username))
        };

        defender.hp -= lostHp;
        battle.log.push(`${defender.username} has ${defender.hp < 1 ? defender.hp : 'no'} health remaining!`)
        if(defender.hp < 1) battle.log.push('💀 ' + randText(battleData.messages.battleKillText).replaceAll('{attacker}', attacker.username).replaceAll('{defender}', defender.username));
    };

    const embed = renderBattleEmbed({battle});
    msg.edit({embeds: [embed]});

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

    const collector = msg.createMessageComponentCollector({time: 10000});
    collector.on('collect', async int => {
        if(!members.has(int.user.id)) return int.reply({content: randText(battleData.messages.notInQuiz), ephemeral: true});
        if(responses.includes(int.user.id)) return int.reply({content: randText(battleData.messages.alreadyRespondedQuiz), ephemeral: true});
        responses.push(int.user.id);
        if(data.shuffledQuiz[parseInt(int.customId)] == data.answer) {
            const user = battle.members.get(int.user.id);
            let points = 100 - (answers * 5);
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
        if(!msg || msg?.deleted) return;
        const embed = new MessageEmbed()
            .setTitle(`Quiz round ${battle.quizRound}!`)
            .setDescription(`The correct answer was:\n${data.answer}\n\n${battle.quizRound < 10 ? 'The next round will start in 3 seconds!' : 'This was the last round! The results are being finalized...'}\n\n**Stats:**\nFirst answer: ${firstResponder ? firstResponder : 'Nobody!'}\nSuccess percent: ${fails+answers == 0 ? '0' : Math.floor(100*(answers/(fails+answers)))}% (${answers} correct, ${fails} wrong)`)
            .setColor(battle.colour);
        await msg.edit({embeds: [embed], components: []});

        if(battle.quizRound < 10) setTimeout(async() => await tickQuiz(...arguments), 3000);
        else setTimeout(async() => await endQuiz(...arguments), 3000);
    });
};

async function handleQuizData({battleData, battle}) {
    const data = battleData.questions[randInt(0, battleData.questions.length)];
    const answer = data.options[data.answer];
    const shuffledQuiz = shuffleArray(data.options);

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    let string = `This is the quiz round ${battle.quizRound}! Using the buttons below, choose the correct answer. There will be 10 rounds, each giving you 10 seconds to answer. Good luck!\n\nQuestion: ${data.title}\n\n`;
    let index = 0;
    
    const row = new MessageActionRow();

    for(const options of shuffledQuiz) {
        string = string + `\n${emojis[index]} ${options}`;
        row.addComponents(new MessageButton()
            .setCustomId(index.toString())
            .setEmoji(emojis[index])
            .setLabel((index + 1).toString())
            .setStyle('SECONDARY')
        );
        index += 1;
    };

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

async function endQuiz({battleData, battle, msg}) {
    const members = battle.members.filter(member => member.hp > 0);
    let lightPoints = 0;
    let darkPoints = 0;

    members.filter(member => member.faction == 'light').forEach(member => lightPoints += member.quizPoints);
    members.filter(member => member.faction == 'dark').forEach(member => darkPoints += member.quizPoints);

    let winningFaction = 'light';
    if(darkPoints == lightPoints) winningFaction = 'both';
    else if(darkPoints > lightPoints) winningFaction = 'dark';

    for(const [key, member] of members) {
        let points = 5;
        if(member.faction == winningFaction || winningFaction == 'both') points += 10;
        const data = await Data.get(msg.guild.id, member.id);
        data.addPoints(points);
        await Data.set(msg.guild.id, member.id, data);
    }
};

module.exports = {
    id: 'clanbattle',
    hourTimer: 1,
    channel: '807311206888636457',
    async execute({channel}){
        const battleData = await readJSON('json/clanbattle.json');
        const embed = new MessageEmbed()
            .setTitle('Clan battle!')
            .setColor('DARK_ORANGE')
            .setDescription(`Welcome to the clan battle! Here you'll participate in text-based battles alongside your fellow clanmates, or against them! You'll be rewarded generously... if you live to see the end!\n\nDetails:\nThe elimination round begins if there are more than 10 people! In this round, you'll fight to the death until enough of you remain!\n\nThe quiz round begins when 10 or less people remain! Here, you'll need to be fast to answer trivia questions. First response gets bonus points! Anyone else who answers within 5 seconds will still be rewarded.\n\nAt the end of the event, whichever faction has the most combined points will win and earn 10 points each! The top 3 individual scorers will receive 15, 10, and 5 points on top as well.\n\nSign up using the button below! You've got 1 minute!`)
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
                .setCustomId('light'),
            new MessageButton()
                .setLabel('add bot user')
                .setCustomId('dud')
                .setStyle('DANGER')
        );

        let battle = {
            members: new Collection(),
            log: [],
            round: 0,
            quizRound: 0,
            colour: '#552222'
        };
        
        const msg = await channel.send({embeds: [embed], components: [row]});
        const collector = msg.createMessageComponentCollector({time: 60000});

        collector.on('collect', async int => {
            if(int.customId == 'dud') {
                const data = {
                    username: randText(battleData.messages.dudUsernames),
                    id: randInt(100000,10000000),
                    hp: 50,
                    maxHp: 50,
                    quizPoints: 0,
                    faction: 'light'
                };
                battle.members.set(data.id, data);
                await int.update({embeds: [embed.setFields({name: 'Participants:', value: battle.members.size.toString()})]});
                await int.followUp({content: `:white_check_mark: Dud user added`, ephemeral: false});
                return;
            };
            if(battle.members.has(int.user.id)) return await int.reply({content: `:x: ${randText(battleData.messages.alreadySignedUp)}`, ephemeral: true});
            const data = {
                username: int.user.username,
                id: int.user.id,
                hp: 50,
                maxHp: 50,
                quizPoints: 0,
                faction: int.customId
            };
            battle.members.set(int.user.id, data);
            await int.update({embeds: [embed.setFields({name: 'Participants:', value: battle.members.size.toString()})]});
            await int.followUp({content: `:white_check_mark: ${randText(battleData.messages.signedUp).replaceAll('{faction}', data.faction)}`, ephemeral: true});
        });

        collector.on('end', async () => {
            if(msg.deleted) return;
            if(battle.members.size < 2) return await msg.edit({content: `Clan battle summary:\n${randText(battleData.messages.fewJoined)}`, embeds: [], components: []});
            const setUpEmbed = new MessageEmbed()
                .setTitle('Starting soon!')
                .setColor('#357722')
                .setDescription(`${battle.members.size.toString()} of you signed up!${battle.members.size < 4 ? ' Kinda scared for you scramps, so few joined... To compensate, the winners rewards will be tripled!' : ''}\nYour clan battle will be starting soon! Stay on your toes!`)
            await msg.edit({embeds: [setUpEmbed], components: []});
            setTimeout(async () => {
                await tickBattle({battleData, battle, msg});
            }, 5000);
        });
    }
};