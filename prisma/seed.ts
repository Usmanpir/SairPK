import { PrismaClient, RoomType } from '@prisma/client';
import { logDemoUsers, seedDemoUsers } from './seed-users';

const prisma = new PrismaClient();

const DESTINATIONS = [
  { name: 'Hunza', region: 'Northern Pakistan', province: 'Gilgit-Baltistan', description: 'A high-altitude valley famed for Karimabad, Attabad Lake and views of Rakaposhi.', bestTimeToVisit: 'April to October' },
  { name: 'Skardu', region: 'Northern Pakistan', province: 'Gilgit-Baltistan', description: 'Gateway to K2 and Deosai, with Shangrila and Upper Kachura lakes nearby.', bestTimeToVisit: 'May to September' },
  { name: 'Swat', region: 'Khyber Pakhtunkhwa', province: 'Khyber Pakhtunkhwa', description: 'The "Switzerland of Pakistan" — green valleys, rivers and Kalam.', bestTimeToVisit: 'March to October' },
  { name: 'Naran Kaghan', region: 'Khyber Pakhtunkhwa', province: 'Khyber Pakhtunkhwa', description: 'Home to Saif-ul-Malook lake and the Babusar Pass route.', bestTimeToVisit: 'June to September' },
  { name: 'Murree', region: 'Punjab', province: 'Punjab', description: 'A colonial-era hill station close to Islamabad, popular year-round.', bestTimeToVisit: 'March to August, and winter for snow' },
  { name: 'Lahore', region: 'Punjab', province: 'Punjab', description: 'Pakistan\'s cultural capital — Badshahi Mosque, Lahore Fort, and food streets.', bestTimeToVisit: 'October to March' },
  { name: 'Gwadar', region: 'Balochistan', province: 'Balochistan', description: 'A coastal port city with pristine beaches and Hingol National Park nearby.', bestTimeToVisit: 'November to February' },
  { name: 'Islamabad', region: 'Punjab', province: 'Islamabad Capital Territory', description: 'Pakistan\'s green, planned capital at the foot of the Margalla Hills.', bestTimeToVisit: 'October to April' }
];

const AMENITY_POOL = ['Free WiFi', 'Parking', 'Breakfast Included', 'Room Service', 'Mountain View', 'Heating', 'Restaurant', 'Airport Shuttle'];

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('Seeding database...');

  // --- Users (one demo login per role; see src/lib/demo-accounts.ts) ---
  await seedDemoUsers(prisma);

  // --- Destinations ---
  const destinationRecords = [];
  for (const d of DESTINATIONS) {
    const record = await prisma.destination.upsert({
      where: { slug: slugify(d.name) },
      update: {},
      create: {
        name: d.name,
        slug: slugify(d.name),
        region: d.region,
        province: d.province,
        description: d.description,
        bestTimeToVisit: d.bestTimeToVisit,
        coverImage: `https://source.unsplash.com/800x600/?${encodeURIComponent(d.name + ' pakistan')}`
      }
    });
    destinationRecords.push(record);
  }

  // --- Hotels + Rooms per destination ---
  let hotelCounter = 0;
  for (const destination of destinationRecords) {
    for (let h = 1; h <= 2; h++) {
      hotelCounter += 1;
      const hotelName = `${destination.name} ${h === 1 ? 'Serena View Hotel' : 'Heritage Resort'}`;
      const hotelSlug = slugify(`${hotelName}-${hotelCounter}`);

      const hotel = await prisma.hotel.upsert({
        where: { slug: hotelSlug },
        update: {},
        create: {
          name: hotelName,
          slug: hotelSlug,
          description: `A comfortable, well-reviewed stay in ${destination.name}, close to the main attractions with mountain and valley views.`,
          destinationId: destination.id,
          address: `Main Road, ${destination.name}`,
          starRating: h === 1 ? 4 : 3,
          status: 'VERIFIED',
          cancellationPolicy: 'Free cancellation up to 48 hours before check-in. 50% charge inside 48 hours; no refund on no-show.',
          contactPhone: '+923001234567',
          contactEmail: `info@${hotelSlug}.pk`,
          images: {
            create: [
              { url: `https://source.unsplash.com/1200x800/?${encodeURIComponent(destination.name + ' hotel')}`, isCover: true },
              { url: `https://source.unsplash.com/1200x800/?${encodeURIComponent(destination.name + ' room')}` }
            ]
          },
          amenities: {
            create: AMENITY_POOL.slice(0, 5).map((name) => ({ name }))
          }
        }
      });

      const roomConfigs: { name: string; type: RoomType; basePrice: number; maxAdults: number }[] = [
        { name: 'Standard Double Room', type: 'DOUBLE', basePrice: 12000, maxAdults: 2 },
        { name: 'Deluxe Mountain View Room', type: 'DELUXE', basePrice: 18000, maxAdults: 2 },
        { name: 'Family Suite', type: 'FAMILY', basePrice: 26000, maxAdults: 4 }
      ];

      for (const rc of roomConfigs) {
        await prisma.room.create({
          data: {
            hotelId: hotel.id,
            name: rc.name,
            type: rc.type,
            description: `${rc.name} with en-suite bathroom, heating and complimentary breakfast.`,
            maxAdults: rc.maxAdults,
            maxChildren: 2,
            bedType: rc.maxAdults > 2 ? 'Two Queen Beds' : 'One Queen Bed',
            numBeds: rc.maxAdults > 2 ? 2 : 1,
            sizeSqm: 24 + rc.maxAdults * 4,
            basePrice: rc.basePrice,
            weekendPrice: Math.round(rc.basePrice * 1.15),
            discountPct: 0,
            taxPct: 5,
            totalUnits: 4,
            cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
            images: {
              create: [{ url: `https://source.unsplash.com/1200x800/?${encodeURIComponent(rc.type.toLowerCase() + ' hotel room')}` }]
            },
            amenities: {
              create: ['Free WiFi', 'Heating', 'Breakfast Included'].map((name) => ({ name }))
            }
          }
        });
      }
    }
  }

  console.log(`Seeded ${destinationRecords.length} destinations and ${hotelCounter} hotels with rooms.`);
  logDemoUsers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
