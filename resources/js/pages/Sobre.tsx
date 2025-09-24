import { Layout } from '@/layouts/Layout';
import { Head } from '@inertiajs/react'


type SobreProps = {
  title: string;
};

export default function Sobre({ title }: SobreProps) {
  return (
    <Layout>
      <Head title={title} />
      <h1 className="text-2xl font-bold mb-4">Sobre o projeto (WIP)</h1>

    </Layout>
  );
}
