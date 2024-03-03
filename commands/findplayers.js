const { getOnlinePlayers, getPlayerInfo } = require('../utils/apirequests');
const fs = require('fs');
const path = require('path');

function readPlayers() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'players.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading from JSON file:', error);
        return [];
    }
}

function writePlayers(players) {
    try {
        fs.writeFileSync(path.join(__dirname, 'players.json'), JSON.stringify(players, null, 4), 'utf8');
    } catch (error) {
        console.error('Error writing to JSON file:', error);
    }
}

module.exports = {
    name: 'findplayers',
    description: 'Finds new players that we can recruit',
    async execute(interaction) {
        const world = parseInt(interaction.options.getString('world'));
        await interaction.deferReply();
        let server = world;
        console.log(`-------- Server ${server} --------`);
        let promises = [];
        let onlinePlayers = await getOnlinePlayers(server);

        Object.keys(onlinePlayers.players).forEach((player) => {
            promises.push(getPlayerInfo(player));
        });

        let playersDetailed = await Promise.all(promises);
        let currentPlayers = readPlayers();

        let newRecruitmentMessages = '';
        let alreadyMessagedPlayers = '';
        for (let i = 0; i < playersDetailed.length; i++) {
            let player = playersDetailed[i];

            if (!player) continue;

            let highestLevel = 0;
            if (player.hasOwnProperty("characters") && player.characters != null) {
                highestLevel = Math.max.apply(
                    Math,
                    player.characters.map(classData => classData.level || 0)
                );
            }

            if (player.guild === null && highestLevel >= 75) {
                if (currentPlayers.includes(player.username)) {
                    // Player already messaged, add to the already messaged list
                    alreadyMessagedPlayers += `You have already messaged the player ${player.username}. Would you like to follow up? \n/msg ${player.username} Hello, how is it going? Are you maybe looking for a guild?\n\n`;
                } else {
                    // New player to message
                    let message = `/msg ${player.username} Hello, how is it going? Are you maybe looking for a guild?`;
                    newRecruitmentMessages += `\`\`\`${message}\`\`\`\n`;

                    // Add new player to the list
                    currentPlayers.push(player.username);
                }
            }
        }

        writePlayers(currentPlayers);

        // Combine new and already messaged players' messages
        let finalMessage = newRecruitmentMessages;
        if (alreadyMessagedPlayers) {
            finalMessage += "Players already messaged:\n" + alreadyMessagedPlayers;
        }

        if (finalMessage) {
            await interaction.editReply(finalMessage);
        } else {
            await interaction.editReply('No suitable players found for recruitment.');
        }
    }
};
