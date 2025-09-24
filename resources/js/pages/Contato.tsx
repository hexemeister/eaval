import { Layout } from '@/layouts/Layout';
import { Head } from '@inertiajs/react'


type ContatoProps = {
  title: string;
};

export default function Contato({ title }: ContatoProps) {
  return (
    <Layout>
      <Head title={title} />
      <h1 className="text-2xl font-bold mb-4">Contato (WIP)</h1>

    </Layout>
  );
}
