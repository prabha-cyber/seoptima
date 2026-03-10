import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
// Import your auth options - path might vary based on your project structure
// Assuming standard NextAuth setup
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    // Basic role check - redirect if not admin
    if (!session || session.user.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <AdminHeader />
                <main className="flex-1 p-6 xl:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
