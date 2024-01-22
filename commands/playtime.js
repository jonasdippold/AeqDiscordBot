const { EmbedBuilder } = require('discord.js');
const { SplitTime, AEQ_LOGO, PLAYER_API } = require('../utils/guildUtils');

module.exports = {
    name: 'playtime',
    description: 'Get the playtime of a specific player',
    async execute(interaction) {
        const username = interaction.options.get('username').value;

        const createEmbed = (title, description, color = '#302334') => {
            return new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setURL('https://aequitas.site/')
                .setThumbnail(AEQ_LOGO)
                .addFields({ name: '\u200B', value: description })
                .setFooter({ text: 'Join Aequitas', iconURL: AEQ_LOGO });
        };

        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

        try {
            const response = await fetch(`${PLAYER_API}/${username}`);
            const data = await response.json();

            if (!data || data.playtime === undefined) {
                console.log(`No playtime data found for user: ${username}`);
                const errorEmbed = createEmbed('Aequitas', `"${username}" has not played on Wynncraft`);
                interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            var { Years, Months, Days, Hours, Minutes } = SplitTime(data.playtime);

            var description = '';
            if (Years > 0) description += `${Years} Years `;
            if (Months > 0) description += `${Months} Months `;
            if (Days > 0) description += `${Days} Days `;
            if (Hours > 0) description += `${Hours} Hours `;
            if (Minutes > 0) description += `${Minutes} Minutes`;

            if (description === '') description = `"${username}" has not played on Wynncraft`;

            const playtimeEmbed = createEmbed('Aequitas', description);
            interaction.reply({ embeds: [playtimeEmbed] });
        } catch (error) {
            console.error("Failed to fetch playtime:", error);
            const errorEmbed = createEmbed('Aequitas', `An error occurred while retrieving playtime for "${username}"`);
            interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};