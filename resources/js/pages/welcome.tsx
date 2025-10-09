import { Aviso } from '@/layouts/Aviso';
import { Layout } from '@/layouts/Layout';
import { SearchBar } from '@/layouts/SearchBar';

import eavalImgUrl from '../../images/eaval.png';

export default function Welcome() {
  return (
    <Layout>
      <Aviso />

      {/* Logo - responsivo */}
      <div className="mx-auto my-6 px-4 sm:px-6 lg:px-8">
        <img src={eavalImgUrl} alt="e-Aval" className="mx-auto my-6 h-auto w-full max-w-[300px] object-contain sm:max-w-[400px]" />
      </div>

      {/* Barra de pesquisa com tooltip - responsiva */}
      <div className="mx-auto mb-0 max-w-3xl px-4 sm:px-6 lg:px-8">
        <SearchBar />
      </div>
    </Layout>
  );
}
