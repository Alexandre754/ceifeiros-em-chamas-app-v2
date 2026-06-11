import { db } from '@/db';
import { settings } from '@/db/schema';

async function main() {
    const sampleSettings = {
        id: 1,
        churchName: 'Igreja Presbiteriana Conservadora Ebenézer Ministério Atibaia',
        acronym: 'IPCECMA',
        email: 'contato@ipcecma.com.br',
        phone: '(11) 4411-5500',
        address: 'Rua Principal, 100 - Centro',
        city: 'Atibaia',
        state: 'SP',
        language: 'pt-BR',
        currency: 'BRL',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        birthdayReminders: true,
        eventReminders: true,
        financialReports: true,
        updatedAt: new Date().toISOString(),
    };

    await db.insert(settings).values(sampleSettings);
    
    console.log('✅ Settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});