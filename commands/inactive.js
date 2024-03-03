require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { fetchPlaytimeData, getUsernameFromUUID } = require('../utils/dataUtils');

module.exports = {
    name: 'inactive',
    description: 'Lists players by playtimes, from lowest to highest',
    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;
        const wynncraftRateLimit = 180; // Max calls per minute
        let wynncraftCalls = 0;
        const rateLimitResetTime = 60000; // 60 seconds

        // Handles rate limit for Wynncraft API calls
        const respectRateLimits = async () => {
            if (wynncraftCalls >= wynncraftRateLimit) {
                console.log('Rate limit reached, waiting for 1 minute');
                await new Promise(resolve => setTimeout(resolve, rateLimitResetTime));
                wynncraftCalls = 0; // Reset after waiting
            }
        };

        try {
            const { calculatedData } = await fetchPlaytimeData();
            await guild.members.fetch();

            const processPlayer = async (player) => {
                await respectRateLimits();
                const wynncraftResponse = await fetch(`https://api.wynncraft.com/v3/player/${player.uuid}`);
                wynncraftCalls++;
                if (!wynncraftResponse.ok) return null;

                const wynncraftData = await wynncraftResponse.json();
                if (!(wynncraftData.guild && wynncraftData.guild.name === 'Aequitas')) return null;

                const playerName = await getUsernameFromUUID(player.uuid);
                if (!playerName) return null;

                const discordMember = guild.members.cache.find(member => member.displayName.toLowerCase() === playerName.toLowerCase());
                if (!discordMember) {
                    console.log(`No Discord member found for player: ${playerName}`);
                    return null; // or return an object to list them without mention
                }

                const playtime = parseFloat(player.playtimeChange);
                if (isNaN(playtime)) return null;

                if (discordMember.roles.cache.has(process.env.INACTIVE_ID) || !discordMember.roles.cache.has(process.env.GUILD_MEMBER)) return null;

                return { name: playerName, playtime: playtime, mention: `<@${discordMember.id}>` };
            };

            const playerPromises = calculatedData.map(player => processPlayer(player));
            const playersList = (await Promise.all(playerPromises)).filter(player => player !== null);
            playersList.sort((a, b) => a.playtime - b.playtime);

            const message = playersList.map(player => `${player.mention} (${player.playtime} hours)`).join('\n') || 'No players found.';

            await interaction.editReply(message);
        } catch (error) {
            console.error('Error handling playtime command:', error);
            await interaction.editReply('Error occurred while processing the command.');
        }
    },
};
