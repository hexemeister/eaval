import AppLayout from '@/layouts/AppLayout';
import { CustomBreadcrumb } from '@/layouts/CustomBreadcrumb';
import { Footer } from '@/layouts/Footer';
import { Header } from '@/layouts/Header';
import { Head, usePage } from '@inertiajs/react';

export function Layout({ children }) {
  const { title, breadcrumb } = usePage().props;
  const breadcrumbItems = breadcrumb || [{ label: 'Página inicial' }];
  const titleSafe = title || 'Página inicial';

  return (
    <AppLayout>
      <div className="flex min-h-screen flex-col text-gray-800 dark:text-gray-200">
        <Head title={titleSafe} />
        <Header />
        <div className="mb-2 text-gray-950 dark:text-gray-50">
          <CustomBreadcrumb items={breadcrumbItems} variant="secondary" />
        </div>
        <div className="flex flex-1">
          <main className="flex-1 p-4 px-4">{children}</main>
        </div>
        <Footer />
      </div>
    </AppLayout>
  );
}
