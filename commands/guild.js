const { convertDate, GUILD_API, AEQ_LOGO } = require('../utils/guildUtils');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guild',
    description: 'Get data about a specific guild',
    async execute(interaction) {
        const guildname = interaction.options.get('guildname').value;

        try {
            const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

            const url = guildname.length < 4 ? `${GUILD_API}/prefix/${guildname}` : `${GUILD_API}/${guildname}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error fetching data for guild: ${guildname}`);
            }

            const data = await response.json();
            if (!data) {
                throw new Error(`Guild "${guildname}" does not exist`);
            }


            var guildCreated = data.created ? await convertDate(data.created) : { date: 'Date not available' };
            console.log(guildCreated);
            const embed = new EmbedBuilder()
                .setColor(48, 25, 52)
                .setTitle('Aequitas')
                .setURL('https://aequitas.site/')
                .setThumbnail(AEQ_LOGO)
                .addFields(
              { name: `${guildname}`, value: `\u200A` },
              { name: `Guild Level`, value: `${data.level} | ${data.xpPercent}%`, inline: true },
              { name: `Territories`, value: `${data.territories}`, inline: true },
              { name: `Wars Completed`, value: `${data.wars}`, inline: true },
              { name: `Date Created`, value: guildCreated.date, inline: true },
              { name: `Total Members`, value: `${data.members.total}`, inline: true },
              { name: `Members Online`, value: `${data.online}`, inline: true },
              )
              .setFooter({ text: 'Join Aequitas', iconURL: AEQ_LOGO });

          interaction.reply({ embeds: [embed] });

      } catch (error) {
          const embed = new EmbedBuilder()
              .setColor(48, 25, 52)
              .setTitle('Aequitas')
              .setURL('https://aequitas.site/')
              .setThumbnail(AEQ_LOGO)
              .addFields(
                  { name: `ERROR`, value: error.message },
              )
              .setFooter({ text: 'Join Aequitas', iconURL: AEQ_LOGO });

          interaction.reply({ embeds: [embed], ephemeral: true });
      }
  }
};