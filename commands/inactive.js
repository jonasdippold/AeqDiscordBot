require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { fetchPlaytimeData, getUsernameFromUUID } = require('../utils/dataUtils');

module.exports = {
    name: 'inactive',
    description: 'Gives a list of players ordered by playtimes from lowest to highest',
    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;
        const wynncraftRateLimit = 180; // Max calls per minute
        let wynncraftCalls = 0;

        // Function to respect rate limits
        const respectRateLimits = async () => {
            if (wynncraftCalls >= wynncraftRateLimit) {
                await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 1 minute
                wynncraftCalls = 0;
            }
        };

        try {
            const { calculatedData, timeRange } = await fetchPlaytimeData();
            await guild.members.fetch();

            let playersList = [];
            for (const player of calculatedData) {
                const playtime = parseFloat(player.playtimeChange);
                if (!isNaN(playtime)) {
                    // Check guild membership in Wynncraft
                    await respectRateLimits();
                    const wynncraftResponse = await fetch(`https://api.wynncraft.com/v3/player/${player.uuid}`);
                    wynncraftCalls++;
                    if (wynncraftResponse.ok) {
                        const wynncraftData = await wynncraftResponse.json();
                        if (wynncraftData.guild && wynncraftData.guild.name === 'Aequitas') {
                            const playerName = await getUsernameFromUUID(player.uuid);
                            if (playerName) {
                                let discordMember = guild.members.cache.find(member => member.displayName.toLowerCase() === playerName.toLowerCase());

                                if (discordMember) {
                                    // Add player info to the list with Discord ID
                                    if (!discordMember.roles.cache.has(process.env.INACTIVE_ID) && discordMember.roles.cache.has(process.env.GUILD_MEMBER)) {
                                        playersList.push({ name: playerName, playtime: playtime, mention: `<@${discordMember.id}>` });
                                    }
                                } else {
                                    // Add player info to the list with just Minecraft name
                                    console.log(`No Discord member found for player: ${playerName}`);
                                    playersList.push({ name: playerName, playtime: playtime, mention: playerName });
                                }
                            }
                        }
                    }
                }
            }

            // Sort the list by playtime
            playersList.sort((a, b) => a.playtime - b.playtime);

            // Create a message from the sorted list
            let message = playersList.map(player => `${player.mention} (${player.playtime} hours)`).join('\n');

            if (message) {
                await interaction.editReply(message);
            } else {
                await interaction.editReply({ content: 'No players found.' });
            }
        } catch (error) {
            console.error('Error handling playtime command:', error);
            await interaction.editReply({ content: 'Error occurred while processing the command.' });
        }
    },
};
