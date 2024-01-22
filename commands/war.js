const { fetchPlayerData } = require('../utils/dataUtils');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'war',
    description: 'Checks how many wars a player did in the last week',
    async execute(interaction) {
        const username = interaction.options.getString('username');
        const { calculatedData, timeRange } = await fetchPlayerData();
        const player = calculatedData.find(p => p.username.toLowerCase() === username.toLowerCase());

        if (player && player.warChange != null) {
            const warEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`War Participation for ${username}`)
                .addFields({ name: 'Wars Participated in Last Week', value: player.warChange.toString(), inline: true })
                .setTimestamp()
                .setFooter({ text: `Guild War Statistics | Data range: ${timeRange}` });

            await interaction.reply({ embeds: [warEmbed] });
        } else {
            await interaction.reply(`No data found or no war data available for player: ${username}`);
        }
    },
};
