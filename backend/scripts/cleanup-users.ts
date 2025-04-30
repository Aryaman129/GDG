import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupUsers() {
  console.log('Starting user cleanup...');

  // List of demo user IDs to keep
  const demoUserIds = [
    'demo-user-id',
    'demo-speaker-id',
    'demo-admin-id'
  ];

  try {
    // Find all users except demo users
    const usersToDelete = await prisma.profile.findMany({
      where: {
        id: {
          notIn: demoUserIds
        },
        // Keep the seeded speakers
        email: {
          notIn: [
            'demo@example.com',
            'demo-speaker@example.com',
            'speaker@example.com',
            'tech_speaker@example.com',
            'design_speaker@example.com',
            'security_speaker@example.com',
            'mobile_speaker@example.com',
            'data_speaker@example.com',
            'admin@example.com'
          ]
        }
      }
    });

    console.log(`Found ${usersToDelete.length} users to delete`);

    // Delete each user
    for (const user of usersToDelete) {
      console.log(`Deleting user: ${user.email} (${user.id})`);
      
      // Delete the user's bookings
      const bookingsDeleted = await prisma.booking.deleteMany({
        where: {
          user_id: user.id
        }
      });
      console.log(`Deleted ${bookingsDeleted.count} bookings for user ${user.id}`);

      // If the user is a speaker, delete their slots and speaker profile
      if (user.role === 'SPEAKER') {
        // Delete slots
        const slotsDeleted = await prisma.sessionSlot.deleteMany({
          where: {
            speaker_id: user.id
          }
        });
        console.log(`Deleted ${slotsDeleted.count} slots for speaker ${user.id}`);

        // Delete speaker profile
        await prisma.speakerProfile.delete({
          where: {
            id: user.id
          }
        }).catch(e => {
          console.log(`No speaker profile found for ${user.id}`);
        });
      }

      // Delete the user profile
      await prisma.profile.delete({
        where: {
          id: user.id
        }
      });
    }

    console.log('User cleanup completed successfully!');
  } catch (error) {
    console.error('Error during user cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUsers();
