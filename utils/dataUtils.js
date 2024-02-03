async function fetchPlayerData() {
    try {
        console.log('Fetching player data...');
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const response = await fetch('http://localhost:3001/api');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const apiData = await response.json();
        console.log(`Data fetched. Number of records: ${apiData.length}`);

        const newestEntryDate = new Date(Math.max(...apiData.map(e => new Date(e.insertion_timestamp))));
        let oneWeekAgo = new Date(newestEntryDate);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let overallOldestEntryDate = oneWeekAgo;

        const groupedData = apiData.reduce((acc, item) => {
            acc[item.username] = acc[item.username] || [];
            acc[item.username].push(item);
            return acc;
        }, {});

        let calculatedData = [];

        for (const username in groupedData) {
            const playerEntries = groupedData[username].sort((a, b) => new Date(a.insertion_timestamp) - new Date(b.insertion_timestamp));
            
            let closestEntryToWeekAgo = playerEntries.reduce((prev, curr) => {
                return (Math.abs(new Date(curr.insertion_timestamp) - oneWeekAgo) < Math.abs(new Date(prev.insertion_timestamp) - oneWeekAgo)) ? curr : prev;
            });

            const warChange = playerEntries[playerEntries.length - 1].wars - closestEntryToWeekAgo.wars;

            calculatedData.push({ username, warChange });
        }

        console.log(`Processed data for ${calculatedData.length} players.`);
        return { 
            calculatedData, 
            timeRange: `From ${overallOldestEntryDate.toISOString().split('T')[0]} to ${newestEntryDate.toISOString().split('T')[0]}`
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        return { calculatedData: [], timeRange: '' };
    }
}

async function fetchPlaytimeData() {
    try {
        console.log('Fetching player data...');
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const response = await fetch('http://localhost:3001/api');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const apiData = await response.json();
        console.log(`Data fetched. Number of records: ${apiData.length}`);

        const newestEntryDate = new Date(Math.max(...apiData.map(e => new Date(e.insertion_timestamp))));
        let oneWeekAgo = new Date(newestEntryDate);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let overallOldestEntryDate = oneWeekAgo;

        const groupedData = apiData.reduce((acc, item) => {
            acc[item.uuid] = acc[item.uuid] || [];
            acc[item.uuid].push(item);
            return acc;
        }, {});

        let candidates = [];

        for (const uuid in groupedData) {
            const playerEntries = groupedData[uuid].sort((a, b) => new Date(a.insertion_timestamp) - new Date(b.insertion_timestamp));
            
            // Assuming playerEntries[0] is the oldest entry
            const joinDate = new Date(playerEntries[0].insertion_timestamp);
            if (joinDate < oneWeekAgo) {
                let closestEntryToWeekAgo = playerEntries.reduce((prev, curr) => {
                    return (Math.abs(new Date(curr.insertion_timestamp) - oneWeekAgo) < Math.abs(new Date(prev.insertion_timestamp) - oneWeekAgo)) ? curr : prev;
                });

                const playtimeChange = playerEntries[playerEntries.length - 1].playtime - closestEntryToWeekAgo.playtime;
        
                if (playtimeChange < 2) {
                    candidates.push({ uuid, playtimeChange });
                }
            }
        }

        console.log(`Processed data for ${candidates.length} players.`);
        return { 
            calculatedData: candidates.map(candidate => ({ uuid: candidate.uuid, playtimeChange: candidate.playtimeChange.toFixed(2) })), 
            timeRange: `From ${overallOldestEntryDate.toISOString().split('T')[0]} to ${newestEntryDate.toISOString().split('T')[0]}`
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        return { calculatedData: [], timeRange: '' };
    }
}

async function getUsernameFromUUID(uuid) {
    try {
        console.log(`Fetching username for UUID: ${uuid}...`);
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const response = await fetch('http://localhost:3001/api');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const apiData = await response.json();
        const userData = apiData.filter(entry => entry.uuid === uuid);

        if (userData.length === 0) {
            console.log(`No data found for UUID: ${uuid}`);
            return null;
        }

        const mostRecentUser = userData.reduce((latest, current) => {
            return new Date(latest.insertion_timestamp) > new Date(current.insertion_timestamp) ? latest : current;
        });

        console.log(`Username found for UUID: ${uuid} is ${mostRecentUser.username}`);
        return mostRecentUser.username;
    } catch (error) {
        console.error(`Error fetching username for UUID ${uuid}:`, error);
        return null;
    }
}



module.exports = { fetchPlayerData, fetchPlaytimeData, getUsernameFromUUID};
