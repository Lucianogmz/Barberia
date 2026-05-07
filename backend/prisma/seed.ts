import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default barber (will be updated with real data on first Google login)
  const barber = await prisma.user.upsert({
    where: { email: 'barber@barberia.com' },
    update: {},
    create: {
      email: 'barber@barberia.com',
      name: 'Barbero',
      role: 'BARBER',
    },
  });

  console.log(`  ✅ Barber created: ${barber.name} (${barber.email})`);

  // Create default services
  const services = [
    {
      name: 'Corte',
      description: 'Corte de cabello clásico',
      price: 5000,
      durationMin: 30,
    },
    {
      name: 'Corte + Barba',
      description: 'Corte de cabello y arreglo de barba',
      price: 8000,
      durationMin: 60,
    },
    {
      name: 'Barba',
      description: 'Arreglo y perfilado de barba',
      price: 3500,
      durationMin: 30,
    },
    {
      name: 'Corte Infantil',
      description: 'Corte de cabello para niños (hasta 12 años)',
      price: 4000,
      durationMin: 30,
    },
  ];

  for (const serviceData of services) {
    const service = await prisma.service.upsert({
      where: {
        id: `seed-${serviceData.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `seed-${serviceData.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...serviceData,
        barberId: barber.id,
      },
    });
    console.log(`  ✅ Service: ${service.name} — $${service.price}`);
  }

  // Create default work schedule (Mon-Sat 09:00-19:00, Sunday off)
  const days = [
    { dayOfWeek: 0, startTime: '09:00', endTime: '19:00', isActive: false }, // Domingo
    { dayOfWeek: 1, startTime: '09:00', endTime: '19:00', isActive: true },  // Lunes
    { dayOfWeek: 2, startTime: '09:00', endTime: '19:00', isActive: true },  // Martes
    { dayOfWeek: 3, startTime: '09:00', endTime: '19:00', isActive: true },  // Miércoles
    { dayOfWeek: 4, startTime: '09:00', endTime: '19:00', isActive: true },  // Jueves
    { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', isActive: true },  // Viernes
    { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isActive: true },  // Sábado
  ];

  for (const day of days) {
    await prisma.workSchedule.upsert({
      where: {
        barberId_dayOfWeek: {
          barberId: barber.id,
          dayOfWeek: day.dayOfWeek,
        },
      },
      update: day,
      create: {
        ...day,
        barberId: barber.id,
      },
    });
  }

  console.log('  ✅ Work schedule created (Lun-Vie 09-19, Sáb 09-14, Dom cerrado)');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
