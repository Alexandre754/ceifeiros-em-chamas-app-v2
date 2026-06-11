import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const sampleUsers = [
        {
            name: 'Administrador Geral',
            email: 'admin@ipcecma.com.br',
            password: await bcrypt.hash('admin123', 10),
            phone: '(11) 98765-4321',
            role: 'admin_geral',
            congregationId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Administrador Sede',
            email: 'sede@ipcecma.com.br',
            password: await bcrypt.hash('sede123', 10),
            phone: '(11) 97654-3210',
            role: 'admin_sede',
            congregationId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Administrador Jarinu',
            email: 'jarinu@ipcecma.com.br',
            password: await bcrypt.hash('jarinu123', 10),
            phone: '(11) 96543-2109',
            role: 'admin_congregacao',
            congregationId: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});