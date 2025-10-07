export const menuItems = [
  { type: 'link', label: 'Página inicial', href: '/' },
  { type: 'link', label: 'Quem somos', href: '/quem-somos' },
  { type: 'link', label: 'Sobre o projeto', href: '/sobre' },
  { type: 'link', label: 'Relatórios Técnicos', href: '/relatorios' },
  { type: 'link', label: 'Pesquisa', href: '/pesquisa' },
  { type: 'link', label: 'Publicações', href: '/publicacoes' },
  {
    type: 'submenu',
    label: 'Estatísticas',
    items: [
      // { label: 'Visão Geral', href: '/estatisticas' },
      {
        label: 'Gráficos',
        items: [
          { label: 'Produção científica com mais publicações por ano', href: '/estatisticas/autores' },
          { label: 'Produção científica por eixo temático por ano', href: '/estatisticas/autores/instituicao' },
          { label: 'Produção científica por segmento institucional por ano', href: '/estatisticas/autores/pais' },
        ],
      },
      {
        label: 'Quantitativos de Publicações Científicas',
        items: [
          { label: 'Total Geral', href: '/estatisticas/anos/decadas/1' },
          { label: 'Por Ano', href: '/estatisticas/anos/seculos/2' },
          { label: 'Por Autor', href: '/estatisticas/anos/seculos/3' },
          { label: 'Por Palavra Chave', href: '/estatisticas/anos/seculos/4' },
          { label: 'Por Produção Científica', href: '/estatisticas/anos/seculos/5' },
          { label: 'Por Área do Conhecimento', href: '/estatisticas/anos/seculos/6' },
          { label: 'Por Tipo de Publicação', href: '/estatisticas/anos/seculos/7' },
          { label: 'Por Eixo Temático', href: '/estatisticas/anos/seculos/8' },
          { label: 'Por Segmento Educacional', href: '/estatisticas/anos/seculos/9' },
          { label: 'Por Forma de Apresentação', href: '/estatisticas/anos/seculos/10' },
          { label: 'Por Estado em que foi publicado/a', href: '/estatisticas/anos/seculos/11' },
          { label: 'Por Região Geográfica', href: '/estatisticas/anos/seculos/12' },
          { label: 'Por País', href: '/estatisticas/anos/seculos/13' },
        ],
      },
    ],
  },
  { type: 'link', label: 'Contato', href: '/contato' },
  // { type: 'link', label: 'Blog', href: '/blog', disabled: true },
];

//  Um item de submenu pode ter href OU items (nunca ambos).
// ✅ Subníveis podem ter mais subníveis (teoricamente ilimitados). 