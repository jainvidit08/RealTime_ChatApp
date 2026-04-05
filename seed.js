require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');

const seedRooms = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for seeding...');

        // Verify if rooms exist first to avoid duplicates
        const existingGroups = await Room.find({ type: 'group' });
        if (existingGroups.length > 0) {
            console.log('Group rooms already exist! Seeding skipped.');
            process.exit(0);
        }

        const roomsToInsert = [
            { name: 'General', type: 'group' },
            { name: 'Engineering', type: 'group' },
            { name: 'Design Ideas', type: 'group' }
        ];

        await Room.insertMany(roomsToInsert);
        console.log('Success: You now have default default group rooms!');

        process.exit(0);
    } catch (error) {
        console.error('Seeding completely failed', error);
        process.exit(1);
    }
};

seedRooms();
