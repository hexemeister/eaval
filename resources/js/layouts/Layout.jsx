// resources/js/layouts/Layout.jsx
import { Header } from '@/layouts/Header';
import { Footer } from '@/layouts/Footer';
import { CustomBreadcrumb } from '@/layouts/CustomBreadcrumb';
import { Head } from '@inertiajs/react'
import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';


export function Layout({ children }) {
  const { title, breadcrumb } = usePage().props;
  const breadcrumbItems = breadcrumb || [{ label: 'Home' }];
  const titleSafe = title || 'Página inicial';

  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col text-gray-800 dark:text-gray-200">
        <Head title={titleSafe} />
        <Header />
        <div className="mb-4 text-gray-950 dark:text-gray-50">
          <CustomBreadcrumb items={breadcrumbItems} variant="secondary" />
        </div>
        <div className="flex flex-1">
          <main className="flex-1 p-4 px-4">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </AppLayout>
  )
}