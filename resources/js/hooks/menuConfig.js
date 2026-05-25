export const menuItems = [
  { type: 'link', label: 'Página inicial', href: '/' },
  {
    type: 'submenu',
    label: 'Quem somos',
    items: [
      { label: 'Equipe Atual', href: '/quem-somos' },
      {
        type: 'submenu',
        label: 'Histórico de Equipes',
        items: [
          { label: 'Equipe de 2023', href: '/quem-somos/historico-equipe/2023' },
          { label: 'Equipe de 2022', href: '/quem-somos/historico-equipe/2022' },
          { label: 'Equipe de 2021', href: '/quem-somos/historico-equipe/2021' },
          { label: 'Equipe de 2020', href: '/quem-somos/historico-equipe/2020' },
          { label: 'Equipe de 2019', href: '/quem-somos/historico-equipe/2019' },
          { label: 'Equipe de 2018', href: '/quem-somos/historico-equipe/2018' },
          { label: 'Equipe de 2017', href: '/quem-somos/historico-equipe/2017' },
          { label: 'Equipe de 2016', href: '/quem-somos/historico-equipe/2016' },
          { label: 'Equipe de 2015', href: '/quem-somos/historico-equipe/2015' },
          { label: 'Equipe de 2014', href: '/quem-somos/historico-equipe/2014' },
        ],
      },
    ],
  },
  { type: 'link', label: 'Sobre o projeto', href: '/sobre' },
  { type: 'link', label: 'Relatórios Técnicos', href: '/relatorios' },
  { type: 'link', label: 'Pesquisa', href: '/pesquisa' },
  { type: 'link', label: 'Publicações', href: '/publicacoes' },
  {
    type: 'submenu',
    label: 'Estatísticas',
    items: [
      { label: 'Visão Geral do Acervo',       href: '/estatisticas/visao-geral' },
      { label: 'Por Ano',                      href: '/estatisticas/ano' },
      { label: 'Por Autor',                    href: '/estatisticas/autor' },
      { label: 'Por Palavra-chave',            href: '/estatisticas/palavra-chave' },
      { label: 'Por Periódico',                href: '/estatisticas/periodico' },
      { label: 'Por Área do Conhecimento',     href: '/estatisticas/area-conhecimento' },
      { label: 'Por Tipo de Publicação',       href: '/estatisticas/tipo-publicacao' },
      { label: 'Por Eixo Temático',            href: '/estatisticas/eixo-tematico' },
      { label: 'Por Segmento Educacional',     href: '/estatisticas/segmento-educacional' },
      { label: 'Por Forma de Apresentação',    href: '/estatisticas/forma-apresentacao' },
      { label: 'Por Estado',                   href: '/estatisticas/estado' },
      { label: 'Por Região Geográfica',        href: '/estatisticas/regiao' },
      { label: 'Por País',                     href: '/estatisticas/pais' },
      { label: 'Por Qualis CAPES',             href: '/estatisticas/qualis' },
    ],
  },
  { type: 'link', label: 'Contato', href: '/contato' },
  // { type: 'link', label: 'Blog', href: '/blog', disabled: true },
];

//  Um item de submenu pode ter href OU items (nunca ambos).
// ✅ Subníveis podem ter mais subníveis (teoricamente ilimitados).
