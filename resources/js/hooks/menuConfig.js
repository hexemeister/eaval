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
    disabled: false,
    items: [
      {
        label: 'Gráficos',
        items: [
          { label: 'Produção científica com mais publicações por ano', href: '/estatisticas/graficos/ano', disabled: false },
        ],
      },
      {
        label: 'Quantitativos de Publicações Científicas',
        items: [
          { label: 'Total Geral', href: '/estatisticas/quantitativo/total', disabled: false },
          { label: 'Por Ano', href: '/estatisticas/quantitativo/ano', disabled: false },
          { label: 'Por Autor', href: '/estatisticas/quantitativo/autor', disabled: false },
          { label: 'Por Palavra Chave', href: '/estatisticas/quantitativo/palavra-chave', disabled: false },
          { label: 'Por Periódico', href: '/estatisticas/quantitativo/periodico', disabled: false },
          { label: 'Por Área do Conhecimento', href: '/estatisticas/quantitativo/area-conhecimento', disabled: false },
          { label: 'Por Tipo de Publicação', href: '/estatisticas/quantitativo/tipo-publicacao', disabled: false },
          { label: 'Por Eixo Temático', href: '/estatisticas/quantitativo/eixo-tematico', disabled: false },
          { label: 'Por Segmento Educacional', href: '/estatisticas/quantitativo/segmento-educacional', disabled: false },
          { label: 'Por Forma de Apresentação', href: '/estatisticas/quantitativo/forma-apresentacao', disabled: false },
          { label: 'Por Estado em que foi publicado/a', href: '/estatisticas/quantitativo/estado', disabled: false },
          { label: 'Por Região Geográfica', href: '/estatisticas/quantitativo/regiao', disabled: false },
          { label: 'Por País', href: '/estatisticas/quantitativo/pais', disabled: false },
          { label: 'Por Qualis CAPES', href: '/estatisticas/quantitativo/qualis', disabled: false },
        ],
      },
    ],
  },
  { type: 'link', label: 'Contato', href: '/contato' },
  // { type: 'link', label: 'Blog', href: '/blog', disabled: true },
];

//  Um item de submenu pode ter href OU items (nunca ambos).
// ✅ Subníveis podem ter mais subníveis (teoricamente ilimitados).
