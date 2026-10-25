import { db } from '@/db';
import { congregations } from '@/db/schema';

async function main() {
    const sampleCongregations = [
        {
            name: 'Sede Atibaia',
            city: 'Atibaia',
            state: 'SP',
            address: 'Rua Principal, 100 - Centro',
            isHeadquarters: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Jarinu',
            city: 'Jarinu',
            state: 'SP',
            address: 'Avenida das Flores, 250 - Centro',
            isHeadquarters: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(congregations).values(sampleCongregations);
    
    console.log('✅ Congregations seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});