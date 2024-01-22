const { fetchPlayerData } = require('../utils/dataUtils');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'totalwars',
    description: 'Displays the total wars done by the guild members in the last week',
    async execute(interaction) {
        try {
            const { calculatedData, timeRange } = await fetchPlayerData();

            const totalWarsLastWeek = calculatedData.reduce((acc, player) => acc + (Number(player.warChange) || 0), 0);

            let warSummary = calculatedData
                .filter(player => player.warChange > 0)
                .sort((a, b) => b.warChange - a.warChange)
                .map(player => `${player.username}: ${player.warChange} war(s)`)
                .join('\n');

            if (warSummary.length > 1024) {
                warSummary = "The list is too long to display.";
            }

            const totalWarsEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Total Wars Last Week')
                .setDescription(`The total wars participated in by the guild members last week is: ${totalWarsLastWeek}`)
                .addFields({ name: 'War Participation (Descending Order)', value: warSummary || "No wars recorded" })
                .setTimestamp()
                .setFooter({ text: `Guild War Statistics | Data range: ${timeRange}` });

            await interaction.reply({ embeds: [totalWarsEmbed] });
        } catch (error) {
            console.error('Error handling totalwars command:', error);
            await interaction.reply('Error occurred while processing the command.');
        }
    },
};
