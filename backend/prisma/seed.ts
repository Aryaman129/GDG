import { PrismaClient, Role } from '@prisma/client';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient();

// Function to generate a UUID
const generateUserId = () => uuidv4();

// Function to hash passwords
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

async function main() {
  console.log('Starting seed...');

  // Create demo users
  const users = [
    {
      email: 'demo@example.com',
      password: 'password123',
      role: Role.USER,
      name: 'Demo User',
      id: 'demo-user-id' // Specific ID for demo user
    },
    {
      email: 'demo-speaker@example.com',
      password: 'password123',
      role: Role.SPEAKER,
      name: 'Demo Speaker',
      id: 'demo-speaker-id', // Specific ID for demo speaker
      expertise: 'Demo Expertise, Conference Speaking, Technical Presentations',
      bio: 'This is a demo speaker account for testing the application. The speaker has experience in various technical topics and is available for bookings.',
      price_per_hour: 100,
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      email: 'speaker@example.com',
      password: 'password123',
      role: Role.SPEAKER,
      name: 'Dr. Sarah Johnson',
      expertise: 'Artificial Intelligence, Machine Learning, Neural Networks',
      bio: 'Dr. Sarah Johnson is a leading AI researcher with over 15 years of experience in developing cutting-edge machine learning algorithms. She has published numerous papers in top-tier conferences and journals, and has been a keynote speaker at major tech events worldwide. Her work focuses on making AI more accessible and ethical.',
      price_per_hour: 150,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      email: 'tech_speaker@example.com',
      password: 'password123',
      role: Role.SPEAKER,
      name: 'Michael Chen',
      expertise: 'Web Development, React, Node.js, Cloud Architecture',
      bio: 'Michael is a full-stack developer and architect with expertise in modern web technologies. He has helped numerous startups scale their applications from prototype to production. With over 10 years of experience in the industry, Michael specializes in creating performant and scalable web applications using the latest technologies.',
      price_per_hour: 120,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      email: 'design_speaker@example.com',
      password: 'password123',
      role: Role.SPEAKER,
      name: 'Emma Rodriguez',
      expertise: 'UX/UI Design, Design Systems, User Research',
      bio: 'Emma is a UX/UI designer with a passion for creating intuitive and accessible interfaces. She has worked with Fortune 500 companies to improve their digital products. Emma combines her background in psychology with design principles to create user-centered experiences that drive engagement and satisfaction.',
      price_per_hour: 130,
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    {
      email: 'security_speaker@example.com',
      password: 'password123',
      role: Role.SPEAKER,
      name: 'James Wilson',
      expertise: 'Cybersecurity, Ethical Hacking, Network Security',
      bio: 'James is a certified ethical hacker and security consultant who has helped organizations identify and fix critical vulnerabilities in their systems. With certifications including CISSP and CEH, James has protected companies from data breaches and implemented robust security protocols for businesses of all sizes.',
      price_per_hour: 160,
      avatar: 'https://randomuser.me/api/portraits/men/46.jpg'
    },
    {
      email: 'mobile_speaker@example.com',
      password: 'password123',
      role: Role.SPEAKER,
      name: 'Priya Patel',
      expertise: 'Mobile Development, iOS, Android, Flutter, React Native',
      bio: 'Priya is a mobile development expert with experience building apps for both iOS and Android platforms. She specializes in cross-platform frameworks like Flutter and React Native, and has published several popular apps with millions of downloads. Priya is passionate about creating seamless mobile experiences.',
      price_per_hour: 140,
      avatar: 'https://randomuser.me/api/portraits/women/33.jpg'
    },
    {
      email: 'data_speaker@example.com',
      password: 'password123',
      role: Role.SPEAKER,
      name: 'David Kim',
      expertise: 'Data Science, Big Data, Analytics, Visualization',
      bio: 'David is a data scientist with expertise in turning complex datasets into actionable insights. He has worked with companies across finance, healthcare, and e-commerce to implement data-driven strategies. David is skilled in Python, R, and various data visualization tools, and enjoys making complex concepts accessible.',
      price_per_hour: 145,
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
    },
    { email: 'admin@example.com', password: 'password123', role: Role.ADMIN, name: 'Demo Admin' }
  ];

  for (const user of users) {
    let userId;

    // If user has a specific ID, use it
    if ('id' in user) {
      userId = user.id;
      console.log(`Using provided ID for ${user.email}: ${userId}`);
    } else {
      // Generate a UUID
      userId = generateUserId();
      console.log(`Generated UUID for ${user.email}: ${userId}`);
    }

    // Hash the password
    const hashedPassword = await hashPassword(user.password);

    // Check if profile already exists in Prisma
    const existingProfile = await prisma.profile.findUnique({
      where: { email: user.email }
    });

    if (existingProfile) {
      console.log(`Profile for ${user.email} already exists in database`);
      userId = existingProfile.id;
    } else {
      // Create profile in Prisma with hashed password
      await prisma.profile.create({
        data: {
          id: userId,
          email: user.email,
          password: hashedPassword,
          full_name: user.name,
          role: user.role,
          otp_verified: true,
          phone: 'phone' in user ? (user.phone as string) : '+1234567890' // Default phone number
        }
      });

      console.log(`Created profile for ${user.email} with role ${user.role}`);
    }

    // If user is a speaker, create a speaker profile
    if (user.role === Role.SPEAKER) {
      const existingSpeakerProfile = await prisma.speakerProfile.findUnique({
        where: { id: userId }
      });

      if (!existingSpeakerProfile) {
        // Use the specific speaker details if available, otherwise use defaults
        const expertise = 'expertise' in user ? user.expertise : 'General Technology';
        const price = 'price_per_hour' in user ? user.price_per_hour : 100;
        const bio = 'bio' in user ? user.bio : 'Experienced speaker in various technology domains.';
        const avatar = 'avatar' in user ? user.avatar : null;

        await prisma.speakerProfile.create({
          data: {
            id: userId as string, // Cast to string to fix TypeScript error
            expertise: expertise,
            price_per_hour: price,
            bio: bio,
            avatar_url: avatar
          }
        });

        console.log(`Created speaker profile for ${user.email}`);

        // Create some availability slots for the speaker
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);

        // Format dates to remove time component
        const todayFormatted = new Date(today.toISOString().split('T')[0]);
        const tomorrowFormatted = new Date(tomorrow.toISOString().split('T')[0]);
        const dayAfterTomorrowFormatted = new Date(dayAfterTomorrow.toISOString().split('T')[0]);
        const threeDaysLaterFormatted = new Date(threeDaysLater.toISOString().split('T')[0]);

        // Create slots for multiple days (9 AM to 4 PM)
        for (const date of [todayFormatted, tomorrowFormatted, dayAfterTomorrowFormatted, threeDaysLaterFormatted]) {
          for (let hour = 9; hour <= 16; hour++) {
            try {
              await prisma.sessionSlot.create({
                data: {
                  speaker_id: userId as string, // Cast to string to fix TypeScript error
                  session_date: date,
                  hour: hour,
                  is_booked: false
                }
              });
            } catch (error) {
              console.log(`Slot for ${date.toISOString().split('T')[0]} at ${hour}:00 already exists or error occurred`);
            }
          }
        }

        console.log(`Created availability slots for ${user.email}`);
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
