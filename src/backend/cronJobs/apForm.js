import wixData from 'wix-data';

export async function apForm() {
    const data = {
        status: `Automatically inserting this data at ${Date()}`
    }
    wixData.insert('CronTest', data)
}
