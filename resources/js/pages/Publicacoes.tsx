import { Layout } from '@/layouts/Layout';

export default function Publicacoes({ results }) {
  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Lista de Publicações (WIP)</h1>
        <div>
          {results.length > 0 ? (
            <ol className="list-inside list-decimal">
              {results.map((publicacao:string, index:number) => (
                <li key={index} className="mb-4">
                  {publicacao.titulo || 'Sem título'} - {publicacao.ano || 'Sem autor'} -{' '}
                  <a href={publicacao.link || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {publicacao.link || 'Sem link'}
                  </a>
                </li>
              ))}
            </ol>
          ) : (
            <p>Nenhuma publicação encontrada.</p>
          )}
        </div>
        {/* Seção Principal - Descrição do Projeto */}
        <section className="mb-12">
          {/* <Card>  
            <CardContent>
              <p className="my-2 mt-6">
                Este banco de dados é fruto de um projeto de pesquisa que vem sendo realizado por pesquisadores e alunos do Curso de Mestrado
                Profissional em Avaliação da Faculdade Cesgranrio. Tem por objetivo investigar, por meio de um processo estruturado de busca em bases
                eletrônicas de dados e análise quanti-qualitativa das informações, o “estado da arte” da área da Avaliação.
              </p>
              <p className="mb-4">
                Na primeira etapa da pesquisa, realizada ao longo de 2014, o projeto teve como meta registrar, organizar e analisar a publicação
                científica na área da Avaliação, no território brasileiro, no período de 2001 a 2014, identificados na plataforma SciELO, de modo a
                oferecer subsídios a pesquisadores interessados em desvelar/aprofundar questões geradas neste campo de conhecimento. Um dos resultados
                deste esforço foi a criação do banco eletrônico de dados disponibilizado neste site.
              </p>
              <p className="mb-4">
                A seleção dos artigos para inclusão nesta base de dados teve como critérios: a delimitação do campo de pesquisa à área da Educação e a
                existência dos vocábulos Educação e Avaliação dentre as palavras-chave dos artigos.
              </p>
              <p className="mb-4">
                O projeto continua ativo, atualizando anualmente o registro de artigos. São elaborados relatórios técnicos anuais das atividades
                realizadas, que podem ser acessadas{' '}
                <Link href="#" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  neste link
                </Link>
                . O grupo de pesquisa entende que este banco de dados é um recurso dinâmico por oferecer a possibilidade de ser alimentado
                continuamente, mesmo após a conclusão formal do projeto. Neste sentido, terá condições de subsidiar com informações específicas a
                produção de artigos científicos na área da Avaliação.
              </p>
              <p className="mb-4">
                Em 2025, o contrato com a empresa responsável pelo desenvolvimento e manutenção da plataforma original e-Aval terminou. O banco de
                dados, tanto a sua estrutura quanto os dados, foram recuperados, porém, a plataforma utilizada para a sua consulta não foi cedida.
                Como resultado, uma nova plataforma está sendo elaborada em código aberto, de modo que o projeto consiga manter-se autônomo em relação
                a quaisquer vínculos comerciais.
              </p>
              <p className="mb-4">
                A base de dados é disponibilizada para consulta pública, sem custos, e pode ser utilizada por pesquisadores, professores, estudantes e
                profissionais interessados na área da Avaliação. Espera-se que este recurso contribua para o desenvolvimento do campo de conhecimento
                da Avaliação no Brasil.
              </p>
            </CardContent>
          </Card> */}
        </section>
      </div>
    </Layout>
  );
}
