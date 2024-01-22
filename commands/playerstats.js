const { EmbedBuilder } = require('discord.js');
const { findPlayerGuildInfo, convertDateISO, convertDate, GUILD_API, PLAYER_API, AEQ_LOGO } = require('../utils/guildUtils');

module.exports = {
    name: 'playerstats',
    description: 'Get data about a specific player',
    async execute(interaction) {
        const username = interaction.options.get('username').value;

        try {
            const response = await fetch(`${PLAYER_API}/${username}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            if (!data.guild || !data.guild.name) {
                throw new Error('Guild data not found for player.');
            }

            const guildresponse = await fetch(`${GUILD_API}/${data.guild.name}`);
            if (!guildresponse.ok) {
                throw new Error(`HTTP error! Status: ${guildresponse.status}`);
            }
            const guildData = await guildresponse.json();

            const guilddata = await findPlayerGuildInfo(guildData.members, username);
            var guildcontributed = guilddata.contributed ? guilddata.contributed.toLocaleString() : '0';
            var guildjoined = await convertDateISO(guilddata.joined);

            var startDate = guildjoined.date;
            var datetime = new Date();
            const diffInMs = new Date(startDate) - new Date(datetime);
            var diffInDays = !isNaN(diffInMs) ? Math.round(diffInMs / (1000 * 60 * 60 * 24)) : 'Date not available';

            var datefirstJoin = data.firstJoin ? await convertDate(data.firstJoin) : { date: 'Date not available' };
            var datelastJoin = data.lastJoin ? await convertDate(data.lastJoin) : { date: 'Date not available' };

            var guildrank = data.guild.rank.charAt(0) + data.guild.rank.substring(1).toLowerCase();
            var Playerrank = data.supportRank;
            switch (Playerrank) {
                case "vip":
                    Playerrank = "VIP";
                    break;
                case "vipplus":
                    Playerrank = "VIP+";
                    break;
                case "hero":
                    Playerrank = "Hero";
                    break;
                case "champion":
                    Playerrank = "Champion";
                    break;
            }
            var PlayerOnline = data.server ?? "Offline";
            var hours = Math.floor(data.playtime);
            
            const embed = new EmbedBuilder()
            .setColor(48, 25, 52)
            .setTitle('Aequitas')
            .setURL('https://aequitas.site/')
            .setThumbnail(AEQ_LOGO)
            .addFields(
              { name: `${username}`, value: `\u200A` },
              { name: `World Server`, value: `${PlayerOnline}`, inline: true },
              { name: `Rank`, value: `${Playerrank}`, inline: true },
              { name: `Total Levels`, value: `${data.globalData.totalLevel}`, inline: true },
              { name: `First Played`, value: `${datefirstJoin.date}`, inline: true },
              { name: `Last Played`, value: `${datelastJoin.date}`, inline: true },
              { name: `Raids completed`, value: `${data.globalData.raids.total}`, inline: true },
              { name: `Guild`, value: `${data.guild.name}`, inline: true },
              { name: `Guild Rank`, value: `${guildrank}`, inline: true },
              { name: `Wars completed`, value: `${data.globalData.wars}`, inline: true },
              { name: `XP contributed`, value: `${guildcontributed}`, inline: true },
              { name: `Joined Guild`, value: `${diffInDays} Days ago`, inline: true },
              { name: `Dungeons completed`, value: `${data.globalData.dungeons.total}`, inline: true },
              { name: `Playtime`, value: `${hours} Hours`, inline: true },
              { name: `Chests found`, value: `${data.globalData.chestsFound}`, inline: true },
              { name: `Quests completed`, value: `${data.globalData.completedQuests}`, inline: true },
              { name: `PvP kills`, value: `${data.globalData.pvp.kills}`, inline: true },
              { name: `Mobs killed`, value: `${data.globalData.killedMobs}`, inline: true },
              { name: `PvP deaths`, value: `${data.globalData.pvp.deaths}`, inline: true }
            )
            .setFooter({ text: 'Join Aequitas', iconURL: AEQ_LOGO });

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error fetching data:", error.message);
            const embed = new EmbedBuilder()
                .setColor(48, 25, 52)
                .setTitle('Aequitas')
                .setURL('https://aequitas.site/')
                .setThumbnail(AEQ_LOGO)
                .addFields({ name: `ERROR`, value: `An error occurred: ${error.message}` })
                .setFooter({ text: 'Join Aequitas', iconURL: AEQ_LOGO });
            interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};