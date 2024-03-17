require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { fetchPlaytimeData, getUsernameFromUUID } = require('../utils/dataUtils');

module.exports = {
    name: 'inactivewarn',
    description: 'Gives a list of players who have playtimes below 2 hours without stating their playtime',
    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;
        const wynncraftRateLimit = 180; 
        let wynncraftCalls = 0;

        const respectRateLimits = async () => {
            if (wynncraftCalls >= wynncraftRateLimit) {
                await new Promise(resolve => setTimeout(resolve, 60000)); 
                wynncraftCalls = 0;
            }
        };

        try {
            const { calculatedData, timeRange } = await fetchPlaytimeData();
            await guild.members.fetch();

            let warningMessage = '';
            for (const player of calculatedData) {
                const playtime = parseFloat(player.playtimeChange);
                if (!isNaN(playtime) && playtime < 2.0) {
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
                                    if (!discordMember.roles.cache.has(process.env.INACTIVE_ID) && discordMember.roles.cache.has(process.env.GUILD_MEMBER)) {
                                        warningMessage += `<@${discordMember.id}> `;
                                    } else {
                                        console.log(`Member ${discordMember.displayName} excluded based on role criteria.`);
                                    }
                                } else {
                                    warningMessage += `${playerName} `;
                                    console.log(`No Discord member found for player: ${playerName}`);
                                }
                            }
                        }
                    }
                }
            }

            if (warningMessage) {
                warningMessage += 'You have been warned because **you haven\'t logged onto Wynncraft/hit the required playtime of 2 hours** during the last week without notice.\nIf you would like to stay in the guild please hit the required playtime in the next 48 hours or give us your reasoning in <#925856455658188860> or, if you prefer, DM one of the chiefs otherwise we will kick you.';
                await interaction.editReply(warningMessage);
            } else {
                await interaction.editReply({ content: 'No players below 2 hours playtime.' });
            }
        } catch (error) {
            console.error('Error handling playtime command:', error);
            await interaction.editReply({ content: 'Error occurred while processing the command.' });
        }
    },
};