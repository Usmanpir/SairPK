import { prisma } from '@/lib/db';

export async function getRoomWithHotel(roomId: string) {
  return prisma.room.findUnique({
    where: { id: roomId },
    include: {
      hotel: { include: { destination: true } },
      availability: true
    }
  });
}
