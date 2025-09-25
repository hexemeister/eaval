// resources/js/layouts/Layout.jsx
import { Header } from '@/layouts/Header';
import { Footer } from '@/layouts/Footer';
import { CustomBreadcrumb } from '@/layouts/CustomBreadcrumb';

export function Layout({ children }) {
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Relatórios' }, // Página atual (sem href)
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="mb-4">
        <CustomBreadcrumb items={breadcrumbItems} variant="secondary" />
      </div>
      <div className="flex flex-1">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}