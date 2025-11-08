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
    disabled: true, // Desabilitado por enquanto
    items: [
      {
        label: 'Gráficos',
        items: [
          { label: 'Produção científica com mais publicações por ano', href: '/estatisticas/autores', disabled: true },
          { label: 'Produção científica por eixo temático por ano', href: '/estatisticas/autores/instituicao', disabled: true },
          { label: 'Produção científica por segmento institucional por ano', href: '/estatisticas/autores/pais', disabled: true },
        ],
      },
      {
        label: 'Quantitativos de Publicações Científicas',
        items: [
          { label: 'Total Geral', href: '/estatisticas/quantitativo/total' },
          { label: 'Por Ano', href: '/estatisticas/quantitativo/ano', disabled: false },
          { label: 'Por Autor', href: '/estatisticas/anos/seculos/3', disabled: true },
          { label: 'Por Palavra Chave', href: '/estatisticas/quantitativo/palavra-chave', disabled: false },
          { label: 'Por Produção Científica', href: '/estatisticas/anos/seculos/5', disabled: true },
          { label: 'Por Área do Conhecimento', href: '/estatisticas/anos/seculos/6', disabled: true },
          { label: 'Por Tipo de Publicação', href: '/estatisticas/anos/seculos/7', disabled: true },
          { label: 'Por Eixo Temático', href: '/estatisticas/anos/seculos/8', disabled: true },
          { label: 'Por Segmento Educacional', href: '/estatisticas/anos/seculos/9', disabled: true },
          { label: 'Por Forma de Apresentação', href: '/estatisticas/anos/seculos/10', disabled: true },
          { label: 'Por Estado em que foi publicado/a', href: '/estatisticas/anos/seculos/11', disabled: true },
          { label: 'Por Região Geográfica', href: '/estatisticas/anos/seculos/12', disabled: true },
          { label: 'Por País', href: '/estatisticas/anos/seculos/13', disabled: true },
        ],
      },
    ],
  },
  { type: 'link', label: 'Contato', href: '/contato' },
  // { type: 'link', label: 'Blog', href: '/blog', disabled: true },
];

//  Um item de submenu pode ter href OU items (nunca ambos).
// ✅ Subníveis podem ter mais subníveis (teoricamente ilimitados).
