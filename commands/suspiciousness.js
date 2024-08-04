const { EmbedBuilder } = require('discord.js');
const { getHypixelFirstLogin } = require('../utils/dataUtils');
const { getPlayerInfo } = require('../utils/apirequests');

module.exports = {
    name: 'sus',
    description: 'Finds how suspicious a player is',
    async execute(interaction) {
        const player = interaction.options.getString('player');

        await interaction.deferReply();

        try {
            console.log(`Fetching data for player: ${player}`);

            const playerData = await getPlayerInfo(player);
            if (!playerData) {
                console.log(`No data returned for player: ${player}`);
                await interaction.editReply('Not a valid Wynncraft player!');
                return;
            }
            console.log(`Player data for ${player}:`, playerData);

            const firstHypixelLogin = await getHypixelFirstLogin(playerData.uuid);
            console.log(`First Hypixel login for ${player}:`, firstHypixelLogin);

            const firstWynncraftLogin = playerData.firstJoin ? new Date(playerData.firstJoin) : null;
            console.log(`First Wynncraft login for ${player}:`, firstWynncraftLogin);

            const wynncraftPlaytime = Math.floor(playerData.playtime * 4.7 / 60) || 0;
            const wynncraftRank = playerData.supportRank || 'PLAYER';
            const wynncraftLevel = playerData.globalData.totalLevel || 0;
            const wynncraftQuests = playerData.globalData.completedQuests || 0;

            const oldestDate = [firstHypixelLogin, firstWynncraftLogin].filter(date => date instanceof Date && !isNaN(date)).sort((a, b) => a - b)[0] || new Date();

            const embedFields = [
                'Wynncraft Join Date',
                'Wynncraft Playtime',
                'Wynncraft Level',
                'Wynncraft Quests',
                'Wynncraft Rank',
                'Minecraft Join Date',
            ];
            const embedValues = [
                firstWynncraftLogin instanceof Date && !isNaN(firstWynncraftLogin) ? firstWynncraftLogin.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
                `${playerData.playtime} hours`,
                `${wynncraftLevel} (all classes)`,
                `${wynncraftQuests} (all classes)`,
                wynncraftRank,
                oldestDate instanceof Date && !isNaN(oldestDate) ? `~${oldestDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : 'N/A',
            ];

            const scores = [
                Math.min(Math.floor((new Date() - firstWynncraftLogin) / (1000 * 60 * 60 * 24 * 2)), 100),
                Math.min(wynncraftPlaytime, 100),
                Math.min(wynncraftLevel / 10, 100),
                Math.min(wynncraftQuests / 2, 100),
                wynncraftRank === 'PLAYER' ? 50 : (wynncraftRank === 'VIP' ? 80 : 100),
                Math.min(Math.floor((new Date() - oldestDate) / (1000 * 60 * 60 * 24 * 10)), 100),
            ];
            
            const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            const suspiciousness = 100 - averageScore;
            const totalScore = parseFloat(Math.max(0, Math.min(100, suspiciousness)).toFixed(2));            

            const embed = new EmbedBuilder()
                .setTitle(`Suspiciousness of ${playerData.username || 'Unknown'}: ${totalScore}%`)
                .setDescription('The rating is based on the following components:')
                .setColor(totalScore <= 40 ? 0x00FF00 : (totalScore <= 20 ? 0xFF0000 : 0xFFFF00))
                .setThumbnail(`https://mc-heads.net/avatar/${playerData.uuid ? playerData.uuid.replace(/-/g, '') : ''}`);

            const fields = embedFields.map((field, i) => ({
                name: field,
                value: `${embedValues[i]}\n${Math.round(100 - scores[i])}% sus`,
                inline: true,
            }));

            embed.addFields(fields);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error fetching data for player ${player}:`, error);
            await interaction.editReply('An error occurred while fetching player data.');
        }
    }
};
