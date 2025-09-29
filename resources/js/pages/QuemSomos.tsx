import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/layouts/Layout';
import { Link } from '@inertiajs/react';

import jessicaMImg from '../../images/jessica-martins.gif';
import kennedyCImg from '../../images/kennedy-carvalho.gif';
import ligiaEImg from '../../images/ligia-elliot.gif';
import ligiaLImg from '../../images/ligia-leite.gif';
import luciaVImg from '../../images/lucia-vilarinho.gif';
import renatoMImg from '../../images/renato-moraes.gif';

export default function QuemSomos() {
  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-4 text-3xl font-bold">Quem Somos (WIP)</h1>

        <Accordion type="multiple" defaultValue={['Pesquisadores', 'Assistentes', 'Equipe']} className="w-full">
          {/* Seção de Pesquisadores */}
          <section className="mb-12">
            <AccordionItem value="Pesquisadores" data-state="open">
              <AccordionTrigger>
                <h2 className="mb-6 text-2xl font-bold">&gt; Pesquisadores</h2>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Profa. Dra. Ligia Gomes Elliot */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={ligiaEImg} alt="Profa. Dra. Ligia Gomes Elliot" />
                        <AvatarFallback>LG</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Profa. Dra. Ligia Gomes Elliot</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        PhD em Educação/Avaliação e Mestre em Estudos Latino Americanos pela Universidade da Califórnia Los Angeles, Mestre em
                        Educação pela Universidade Federal do Rio de Janeiro, Coordenadora do Programa de Pós Graduação e do Curso de Mestrado
                        Profissional em Avaliação da Fundação Cesgranrio e pesquisadora do Centro de Avaliação. Pós Doutorado em Avaliação, UFRJ.
                      </p>
                      <p className="italic">Currículo Lattes:</p>
                      <Link
                        href="http://lattes.cnpq.br/3407515397492906"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/3407515397492906
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Profa. Dra. Ligia Silva Leite */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={ligiaLImg} alt="Profa. Dra. Ligia Silva Leite" />
                        <AvatarFallback>LL</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Profa. Dra. Ligia Silva Leite</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        Doutora em Educação pela Temple University e Mestre em Educação pela Universidade Federal do Rio de Janeiro (UFRJ). Professora
                        do Curso de Mestrado Profissional em Avaliação da Fundação Cesgranrio e da Faculdade de Educação da Universidade do Estado do
                        Rio de Janeiro (UERJ). Pós Doutorado em Tecnologia Educacional pela Universidade de Pittsburgh.
                      </p>
                      <div className="italic">Currículo Lattes:</div>
                      <Link
                        href="http://lattes.cnpq.br/7255232148754522"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/7255232148754522
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Profa. Dra. Lucia Regina Goulart Vilarinho */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={luciaVImg} alt="Profa. Dra. Lucia Regina Goulart Vilarinho" />
                        <AvatarFallback>LV</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Profa. Dra. Lucia Regina Goulart Vilarinho</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        Doutora e Mestre em Educação pela Faculdade de Educação, Universidade Federal do Rio de Janeiro (UFRJ); Pedagoga, pela
                        Pontifícia Universidade Católica do Rio de Janeiro - PUC-Rio; professora aposentada da Faculdade de Educação da Universidade
                        Federal do Rio de Janeiro (UFRJ); professora do PPGE da Universidade Estácio de Sá/RJ (2000-2014), professora do Curso de
                        Mestrado Profissional em Avaliação da Fundação Cesgranrio.
                      </p>
                      <div className="italic">Currículo Lattes:</div>
                      <Link
                        href="http://lattes.cnpq.br/1757678864925265"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/1757678864925265
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </section>

          {/* Seção de Assistentes de Pesquisa e Alunos */}
          <section className="mb-12">
            <AccordionItem value="Assistentes" data-state="open">
              <AccordionTrigger>
                <h2 className="mb-6 text-2xl font-bold">&gt; Assistentes de pesquisa e alunos</h2>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-inside list-disc space-y-2">
                  <li>Ano 2023 (WIP)</li>
                  <li>Ano 2022 (WIP)</li>
                  <li>Ano 2021 (WIP)</li>
                  <li>Ano 2020 (WIP)</li>
                  <li>Ano 2019 (WIP)</li>
                  <li>Ano 2018 (WIP)</li>
                  <li>Ano 2017 (WIP)</li>
                  <li>Ano 2016 (WIP)</li>
                  <li>Ano 2015 (WIP)</li>
                  <li>Ano 2014 (WIP)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </section>

          {/* Seção de Designer do Logo */}
          <AccordionItem value="Equipe" data-state="open">
            <AccordionTrigger>
              <h3 className="mb-6 text-2xl font-bold">&gt; Equipe</h3>
            </AccordionTrigger>
            <AccordionContent>
              <section>
                <h2 className="mb-6 text-xl font-bold">Designer do logo</h2>
                <Card>
                  <CardHeader className="flex flex-row items-center space-x-4">
                    <Avatar className="size-18">
                      <AvatarImage src={jessicaMImg} alt="Jéssica Marques Marins" />
                      <AvatarFallback>JM</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl">Jéssica Marques Marins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">
                      Graduanda do Curso de Comunicação Visual Design da Escola de Belas Artes da Universidade Federal do Rio de Janeiro (UFRJ).
                      Estagiária de Design da Pró-reitoria de Pós-graduação e Pesquisa da UFRJ (PR-2/UFRJ).
                    </p>
                    <div className="italic">Currículo Lattes: </div>
                    <Link
                      href="http://lattes.cnpq.br/4407621365289182"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline hover:underline-offset-4"
                    >
                      http://lattes.cnpq.br/4407621365289182
                    </Link>
                  </CardContent>
                </Card>
              </section>

              {/* Seção de Desenvolvedores */}
              <section className="my-12">
                <h3 className="mb-6 text-xl font-bold">Desenvolvedores</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Renato Miguel de Moraes */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={renatoMImg} alt="Renato Miguel de Moraes" />
                        <AvatarFallback>LG</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Renato Miguel de Moraes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        Doutorando em Educação, especialidade Tecnologias da Informação e Comunicação na Educação pelo Instituto de Educação da
                        Universidade de Lisboa. Mestre em Avaliação pela Faculdade Cesgranrio (2022). Concluiu especialização em sistemas de
                        informação com ênfase em internet (Programa e-IS Expert) em 2014. Graduado em Sistemas de Computação pela Universidade Federal
                        Fluminense - CEDERJ (2013) e em Licenciatura em Matemática pela Universidade Federal do Rio de Janeiro (2010). Atualmente é
                        analista de tecnologia da informação da Universidade Federal do Rio de Janeiro. Foi líder técnico do projeto de sistema de
                        informação AVADES na UFRJ para realização da Avaliação de Desempenho Profissional (2019).
                      </p>
                      <div className="italic">Currículo Lattes: </div>
                      <Link
                        href="http://lattes.cnpq.br/9721643657708654"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/9721643657708654
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Kennedy Simões Santos Carvalho */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={kennedyCImg} alt="Kennedy Simões Santos Carvalho" />
                        <AvatarFallback>LL</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Kennedy Simões Santos Carvalho</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        Engenheiro de Software com Mestrado em Avaliação pela Cesgranrio, atuando atualmente como Analista de TI no INES. Minha
                        pesquisa concentra-se na avaliação de políticas públicas, utilizando dados e análise para embasar tomadas de decisão
                        estratégicas. Possuo robusta experiência no ciclo completo de desenvolvimento de software, liderando projetos de alta
                        complexidade e orientando equipes para soluções inovadoras. Minhas áreas de expertise incluem tecnologias como Python e
                        Node.js, com um foco contínuo na entrega de valor e resultados de excelência. Além disso, sou apaixonado por inovação digital
                        e melhoria contínua, buscando sempre contribuir de maneira significativa para o avanço das práticas de Tecnologia da
                        Informação e Engenharia de Software.
                      </p>
                      <div className="italic">Currículo Lattes: </div>
                      <Link
                        href="http://lattes.cnpq.br/8318645381307182"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/8318645381307182
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Layout>
  );
}
