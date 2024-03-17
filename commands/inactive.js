require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { fetchPlaytimeData, getUsernameFromUUID } = require('../utils/dataUtils');

module.exports = {
    name: 'inactive',
    description: 'Lists players by playtimes, from lowest to highest',
    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;
        const wynncraftRateLimit = 180; // max calls per minute
        let wynncraftCalls = 0;

        //  rate limits
        const respectRateLimits = async () => {
            if (wynncraftCalls >= wynncraftRateLimit) {
                await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 1 minute
                wynncraftCalls = 0;
            }
        };

        try {
            const { calculatedData } = await fetchPlaytimeData();
            await guild.members.fetch();

            let playerListMessage = '**Players with less than 2 hours of playtime:**\n';
            for (const player of calculatedData) {
                const playtime = parseFloat(player.playtimeChange);
                if (!isNaN(playtime) && playtime < 2.0) {
                    // check guild membership 
                    await respectRateLimits();
                    const wynncraftResponse = await fetch(`https://api.wynncraft.com/v3/player/${player.uuid}`);
                    wynncraftCalls++;
                    if (wynncraftResponse.ok) {
                        const wynncraftData = await wynncraftResponse.json();
                        if (wynncraftData.guild && wynncraftData.guild.name === 'Aequitas') {
                            const playerName = await getUsernameFromUUID(player.uuid);
                            if (playerName) {
                                let discordMember = guild.members.cache.find(member => member.displayName.toLowerCase() === playerName.toLowerCase());

                                if (discordMember && !discordMember.roles.cache.has(process.env.INACTIVE_ID) && discordMember.roles.cache.has(process.env.GUILD_MEMBER)) {
                                    playerListMessage += `- ${playerName} (<@${discordMember.id}>), Playtime: ${playtime} hours\n`;
                                } else {
                                    console.log(`Member ${discordMember ? discordMember.displayName : playerName} excluded based on role criteria or not found.`);
                                }
                            }
                        }
                    }
                }
            }

            if (playerListMessage.length > 0) {
                await interaction.editReply(playerListMessage);
            } else {
                await interaction.editReply({ content: 'No players below 2 hours playtime.' });
            }
        } catch (error) {
            console.error('Error handling playtime command:', error);
            await interaction.editReply({ content: 'Error occurred while processing the command.' });
        }
    },
};