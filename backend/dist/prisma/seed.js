"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
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
    const days = [
        { dayOfWeek: 0, isActive: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: null, afternoonEnd: null },
        { dayOfWeek: 1, isActive: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '17:00', afternoonEnd: '20:00' },
        { dayOfWeek: 2, isActive: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '17:00', afternoonEnd: '20:00' },
        { dayOfWeek: 3, isActive: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '17:00', afternoonEnd: '20:00' },
        { dayOfWeek: 4, isActive: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '17:00', afternoonEnd: '20:00' },
        { dayOfWeek: 5, isActive: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '17:00', afternoonEnd: '20:00' },
        { dayOfWeek: 6, isActive: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: null, afternoonEnd: null },
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
    console.log('  ✅ Work schedule created (Lun-Vie 08-12 y 17-20, Sáb 08-12, Dom cerrado)');
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
//# sourceMappingURL=seed.js.map