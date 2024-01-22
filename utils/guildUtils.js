async function findPlayerGuildInfo (members, username) {
    try {
    for (const rank in members) {
      for (const memberName in members[rank]) {
        if (memberName.toLowerCase() === username.toLowerCase()) {
          const playerData = members[rank][memberName];
          return {
            contributed: playerData.contributed,
            joined: playerData.joined
        }
          };
        }
      }
    } catch (error) {
        console.error('Player not found in the guild.');
    }
} 

async function convertDateISO(date) {
    try{
        var date              = date.split('T')[0];
        var year              = date.split('-')[0];
        var month             = date.split('-')[1];
        var day               = date.split('-')[2];
        var date              = `${year}-${month}-${day}`
        return({"date":date})
    } catch (error) {
        console.error('Issue with converting the date');
    }
}

async function convertDate(date) {
    try{
        var date              = date.split('T')[0];
        var year              = date.split('-')[0];
        var month             = date.split('-')[1];
        var day               = date.split('-')[2];
        var date              = `${day}.${month}.${year}`
        return({"date":date})
    } catch (error) {
    console.error('Issue with converting the date');
    }
}

function SplitTime(totalHours) {
    const hoursPerYear = 24 * 365;
    const hoursPerMonth = 24 * 30; 
    const hoursPerDay = 24;

    let remainingHours = totalHours;

    const Years = Math.floor(remainingHours / hoursPerYear);
    remainingHours -= Years * hoursPerYear;

    const Months = Math.floor(remainingHours / hoursPerMonth);
    remainingHours -= Months * hoursPerMonth;

    const Days = Math.floor(remainingHours / hoursPerDay);
    remainingHours -= Days * hoursPerDay;

    const Hours = Math.floor(remainingHours);
    const Minutes = Math.floor((remainingHours - Hours) * 60);

    return { Years, Months, Days, Hours, Minutes };
}


const PLAYER_API = 'https://api.wynncraft.com/v3/player';
const GUILD_API = 'https://api.wynncraft.com/v3/guild';
const AEQ_LOGO = 'https://cdn.discordapp.com/attachments/1182043474103652352/1187537550081015879/Aequitas-1.png'

module.exports = { findPlayerGuildInfo, convertDateISO, convertDate, SplitTime, PLAYER_API, GUILD_API, AEQ_LOGO };

