const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function getOnlinePlayers(server) {
    try {
        console.log(`Fetching online players for server: ${server}...`);
        const response = await fetch(`https://api.wynncraft.com/v3/player?server=${server}`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const onlinePlayersData = await response.json();
        console.log(`Data fetched for server: ${server}`);
        return onlinePlayersData;
    } catch (error) {
        console.error('Error fetching online players:', error);
        return null;
    }
}

async function getPlayerInfo(username) {
    try {
        console.log(`Fetching info for player: ${username}...`); t
        const response = await fetch(`https://api.wynncraft.com/v3/player/${username}?fullResult=True`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const playerInfoData = await response.json();
        console.log(`Data fetched for player: ${username}`);
        return playerInfoData;
    } catch (error) {
        console.error(`Error fetching info for player ${username}:`, error);
        return null;
    }
}

module.exports = { getOnlinePlayers, getPlayerInfo};
