import { db } from '@/db';
import { banners } from '@/db/schema';

async function main() {
    const sampleBanners = [
        {
            title: 'Bem-vindo à IPCECMA',
            description: 'Uma comunidade de fé, amor e esperança. Venha nos visitar e fazer parte da nossa família.',
            imageUrl: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1200&q=80',
            linkUrl: '/sobre',
            order: 1,
            active: true,
            startDate: null,
            endDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'Cultos aos Domingos',
            description: 'Junte-se a nós todos os domingos às 10h para adoração, louvor e mensagem da Palavra.',
            imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&q=80',
            linkUrl: '/eventos',
            order: 2,
            active: true,
            startDate: null,
            endDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'Encontro de Jovens',
            description: 'Sextas às 19h - Um momento especial para jovens buscarem a Deus através de louvor, comunhão e estudos.',
            imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&q=80',
            linkUrl: '/jovens',
            order: 3,
            active: true,
            startDate: '2024-01-01',
            endDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            title: 'Reunião de Oração',
            description: 'Quartas às 19h30 - Venha interceder conosco pela igreja, famílias e nossa nação.',
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
            linkUrl: '/oracao',
            order: 4,
            active: true,
            startDate: null,
            endDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(banners).values(sampleBanners);
    
    console.log('✅ Banners seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});