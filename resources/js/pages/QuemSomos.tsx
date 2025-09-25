import { Layout } from '@/layouts/Layout';
import { Head } from '@inertiajs/react'

type QuemSomosProps = {
  title: string;
};

export default function QuemSomos({ title }: QuemSomosProps) {

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Quem Somos' }, // Página atual (sem href)
  ];

  return (
    <Layout>
      <Head title={title} />
      
      <h1 className="text-2xl font-bold mb-4">Quem Somos (WIP)</h1>

    </Layout>
  );
}
