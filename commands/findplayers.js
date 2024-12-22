const { getOnlinePlayers, getPlayerInfo } = require('../utils/apirequests');
const fs = require('fs');
const path = require('path');
const playerdata = require('./players.json')

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

        // read the current list of players
        let currentPlayers = readPlayers();

        let recruitmentMessages = '';
        for (let i = 0; i < playersDetailed.length; i++) {
            let player = playersDetailed[i];
            if (!player) {
                continue;
            }
            let highestLevel = 0;
            if (player.hasOwnProperty("characters") && player.characters != null) {
                highestLevel = Math.max.apply(
                    Math,
                    Object.values(player.characters)
                        .map(classData => classData.level ? classData.level : 0)
                );
            }

            if (player.guild === null && highestLevel >= 95) {
                let message = `/msg ${player.username} Hey, how's it going? Are you perhaps looking for a guild?`;
                
                // check if the player has already been messaged
                if (!currentPlayers.includes(player.username)) {
                    // Add player to the list
                    currentPlayers.push(player.username);
                    recruitmentMessages += `\`\`\`${message}\`\`\`\n`;
                } else {
                    recruitmentMessages += `You have already messaged the player ${player.username}\n`;
                }
            }
        }
        writePlayers(currentPlayers);

        if (recruitmentMessages) {
            await interaction.editReply(recruitmentMessages);
        } else {
            await interaction.editReply('No suitable players found for recruitment.');
        }
    }
};
