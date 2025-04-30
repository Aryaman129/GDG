import { PrismaClient } from '@prisma/client';
import { addDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to add demo slots...');

  // Get all speakers
  const speakers = await prisma.speakerProfile.findMany();
  
  if (speakers.length === 0) {
    console.log('No speakers found. Please create speakers first.');
    return;
  }
  
  console.log(`Found ${speakers.length} speakers. Adding slots...`);

  // For each speaker, create slots for the next 7 days
  for (const speaker of speakers) {
    console.log(`Creating slots for speaker ID: ${speaker.id}`);
    
    // Create slots for the next 7 days
    for (let day = 0; day < 7; day++) {
      const date = addDays(new Date(), day);
      const sessionDate = startOfDay(date);
      
      // Create slots for hours 9-16 (9 AM to 4 PM)
      for (let hour = 9; hour <= 16; hour++) {
        // Randomly decide if this slot should be created (70% chance)
        if (Math.random() < 0.7) {
          try {
            await prisma.sessionSlot.create({
              data: {
                speaker_id: speaker.id,
                session_date: sessionDate,
                hour,
                is_booked: false
              }
            });
            console.log(`Created slot for ${sessionDate.toISOString().split('T')[0]} at ${hour}:00`);
          } catch (error) {
            // Ignore duplicate slots
            console.log(`Slot already exists for speaker ${speaker.id} on ${sessionDate.toISOString().split('T')[0]} at ${hour}:00`);
          }
        }
      }
    }
  }
  
  console.log('Demo slots added successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
