import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';
import { addDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

// Define types for our user data
interface SpeakerData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: "SPEAKER";
  expertise: string;
  bio: string;
  pricePerHour: number;
}

interface UserData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: "USER";
}

interface AdminData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: "ADMIN";
}

type UserDataType = SpeakerData | UserData | AdminData;

async function main() {
  console.log('Starting to add demo data...');

  // Create demo speakers
  const demoSpeakers: SpeakerData[] = [
    {
      email: 'tech_speaker@example.com',
      password: 'password123',
      fullName: 'Alex Johnson',
      phone: '+1234567890',
      role: Role.SPEAKER,
      expertise: 'Web Development, JavaScript, React',
      bio: 'Alex is a senior web developer with over 10 years of experience building scalable web applications. Specializes in React and modern JavaScript frameworks.',
      pricePerHour: 150
    },
    {
      email: 'design_speaker@example.com',
      password: 'password123',
      fullName: 'Sophia Chen',
      phone: '+1234567891',
      role: Role.SPEAKER,
      expertise: 'UI/UX Design, Product Design',
      bio: 'Sophia is a product designer who has worked with startups and Fortune 500 companies. She specializes in creating intuitive and beautiful user experiences.',
      pricePerHour: 175
    },
    {
      email: 'ai_speaker@example.com',
      password: 'password123',
      fullName: 'Michael Rodriguez',
      phone: '+1234567892',
      role: Role.SPEAKER,
      expertise: 'Artificial Intelligence, Machine Learning',
      bio: 'Michael is an AI researcher and practitioner with expertise in machine learning algorithms and neural networks. He has published papers in top AI conferences.',
      pricePerHour: 200
    },
    {
      email: 'business_speaker@example.com',
      password: 'password123',
      fullName: 'Emma Wilson',
      phone: '+1234567893',
      role: Role.SPEAKER,
      expertise: 'Business Strategy, Entrepreneurship',
      bio: 'Emma is a serial entrepreneur who has founded and sold multiple successful startups. She now mentors early-stage founders and speaks about business strategy.',
      pricePerHour: 180
    },
    {
      email: 'data_speaker@example.com',
      password: 'password123',
      fullName: 'David Kim',
      phone: '+1234567894',
      role: Role.SPEAKER,
      expertise: 'Data Science, Big Data, Analytics',
      bio: 'David is a data scientist with experience in building data pipelines and analytics solutions. He specializes in turning complex data into actionable insights.',
      pricePerHour: 165
    }
  ];

  // Create demo user
  const demoUser: UserData = {
    email: 'user@example.com',
    password: 'password123',
    fullName: 'Demo User',
    phone: '+1234567895',
    role: Role.USER
  };

  // Create demo admin
  const demoAdmin: AdminData = {
    email: 'admin@example.com',
    password: 'password123',
    fullName: 'Admin User',
    phone: '+1234567896',
    role: Role.ADMIN
  };

  // Create all users
  for (const userData of [...demoSpeakers, demoUser, demoAdmin] as UserDataType[]) {
    const { email, password, fullName, phone, role } = userData;
    // Extract speaker-specific properties only if it's a speaker
    const expertise = 'expertise' in userData ? userData.expertise : undefined;
    const bio = 'bio' in userData ? userData.bio : undefined;
    const pricePerHour = 'pricePerHour' in userData ? userData.pricePerHour : undefined;

    // Check if user already exists
    const existingUser = await prisma.profile.findUnique({
      where: { email }
    });

    if (!existingUser) {
      console.log(`Creating user: ${fullName} (${email})`);

      // Hash password
      const hashedPassword = await hash(password, 10);

      // Create user
      const user = await prisma.profile.create({
        data: {
          email,
          password: hashedPassword,
          full_name: fullName,
          phone,
          role,
          otp_verified: true // Skip OTP verification for demo
        }
      });

      // Create speaker profile if role is SPEAKER
      if (role === Role.SPEAKER && expertise && bio && pricePerHour) {
        await prisma.speakerProfile.create({
          data: {
            id: user.id, // Use same ID as user
            expertise,
            bio,
            price_per_hour: pricePerHour
          }
        });

        // Create available slots for the next 7 days
        await createSlotsForSpeaker(user.id);
      }
    } else {
      console.log(`User already exists: ${email}`);

      // If speaker, ensure they have slots
      if (role === Role.SPEAKER) {
        const speakerProfile = await prisma.speakerProfile.findUnique({
          where: { id: existingUser.id }
        });

        if (speakerProfile) {
          // Check if speaker has any slots
          const slots = await prisma.sessionSlot.findMany({
            where: { speaker_id: existingUser.id }
          });

          if (slots.length === 0) {
            console.log(`Creating slots for existing speaker: ${fullName}`);
            await createSlotsForSpeaker(existingUser.id);
          }
        }
      }
    }
  }

  console.log('Demo data added successfully!');
}

async function createSlotsForSpeaker(speakerId: string) {
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
              speaker_id: speakerId,
              session_date: sessionDate,
              hour,
              is_booked: false
            }
          });
        } catch (error) {
          // Ignore duplicate slots
          console.log(`Slot already exists for speaker ${speakerId} on ${sessionDate} at ${hour}:00`);
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
