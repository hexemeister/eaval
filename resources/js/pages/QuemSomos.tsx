import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/layouts/Layout';
import { Link } from '@inertiajs/react';

import { User } from 'lucide-react';
import flaviaSImg from '../../images/flavia-santos.gif';
import jessicaMImg from '../../images/jessica-martins.gif';
import kennedyCImg from '../../images/kennedy-carvalho.gif';
import ligiaEImg from '../../images/ligia-elliot.gif';
import ligiaLImg from '../../images/ligia-leite.gif';
import luciaVImg from '../../images/lucia-vilarinho.gif';
import renatoMImg from '../../images/renato-moraes.gif';
import sandraFImg from '../../images/sandra-ferreira.gif';
import soniaFImg from '../../images/sonia-freitas.gif';

export default function QuemSomos() {
  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-4 text-3xl font-bold">Quem Somos (WIP)</h1>

        <Accordion type="multiple" defaultValue={['Pesquisadores', 'Historico']} className="w-full">
          {/* Seção de Pesquisadores */}
          <section className="mb-12">
            <AccordionItem className="border-b-0" value="Pesquisadores" data-state="open">
              <AccordionTrigger>
                <h2 className="mb-6 text-2xl font-bold">&gt; Equipe</h2>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Profa. Dra. Ligia Silva Leite */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={ligiaLImg} alt="Profa. Dra. Ligia Silva Leite" />
                        <AvatarFallback>LL</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Profa. Dra. Ligia Silva Leite</CardTitle>
                      <CardDescription>Pesquisadora</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        Doutora em Educação pela Temple University e Mestre em Educação pela Universidade Federal do Rio de Janeiro (UFRJ). Professora
                        do Curso de Mestrado Profissional em Avaliação da Fundação Cesgranrio e da Faculdade de Educação da Universidade do Estado do
                        Rio de Janeiro (UERJ). Pós Doutorado em Tecnologia Educacional pela Universidade de Pittsburgh.
                      </p>
                      <div className="italic">Currículo Lattes:</div>
                      <a
                        href="http://lattes.cnpq.br/7255232148754522"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/7255232148754522
                      </a>
                    </CardContent>
                  </Card>

                  {/* Flavia Giffoni de Abreu dos Santos */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={flaviaSImg} alt="Flavia Giffoni de Abreu dos Santos" />
                        <AvatarFallback>FS</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Flavia Giffoni de Abreu dos Santos</CardTitle>
                      <CardDescription>Assistente de pesquisa</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        Mestre em Avaliação pela Faculdade Cesgranrio, especialista em Planejamento, Implementação e Gestão da EaD (UFF), especialista
                        em Design Instrucional para EaD Virtual (UNIFEI), especialista em Administração e supervisão escolar (UCAM) e possui
                        licenciatura em Letras Português-Espanhol (UFRJ). Professora na Universidade Estácio de Sá e Consultora em projetos de
                        educação a distância e em soluções pedagógicas mediadas pelas novas tecnologias.
                      </p>
                      <div className="italic">Currículo Lattes:</div>
                      <a
                        href="http://lattes.cnpq.br/0143191776317899"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/0143191776317899
                      </a>
                    </CardContent>
                  </Card>

                  {/* Sandra Maria Martins Redovalio Ferreira */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={sandraFImg} alt="Sandra Maria Martins Redovalio Ferreira" />
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Sandra Maria Martins Redovalio Ferreira</CardTitle>
                      <CardDescription>Assistente de pesquisa</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        Mestre em Avaliação (Programa de Mestrado Profissional em Avaliação da Fundação Cesgranrio), pós-graduada em Metodologia do
                        Ensino Superior (Centro Universitário da Cidade), especialista em Avaliação a Distância (Universidade de Brasília, UnB),
                        especialista em Planejamento, Implantação e Gestão da Educação a Distância (Universidade Federal Fluminense -UFF e
                        Universidade Aberta do Brasil - UAB), psicóloga (Universidade Gama Filho). Professora da Escola de Administração Judiciária
                        (Tribunal de Justiça / RJ) e Professora aposentada da Faculdade Cesgranrio.
                      </p>
                      <div className="italic">Currículo Lattes:</div>
                      <a
                        href="http://lattes.cnpq.br/7928378322641468"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/7928378322641468
                      </a>
                    </CardContent>
                  </Card>

                  {/* Sonia Regina Natal de Freitas */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={soniaFImg} alt="Sonia Regina Natal de Freitas" />
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Sonia Regina Natal de Freitas</CardTitle>
                      <CardDescription>Assistente de pesquisa</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        Mestre em Avaliação pelo Programa de Mestrado Profissional em Avaliação da Fundação Cesgranrio, especialista em Informática
                        Educativa pela Faculdade de Humanidades Pedro II (FAHUPE). Possui licenciatura em Matemática pela UERJ. Professora do Colégio
                        Pedro II.
                      </p>
                      <div className="italic">Currículo Lattes:</div>
                      <a
                        href="http://lattes.cnpq.br/9134287486022354"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/9134287486022354
                      </a>
                    </CardContent>
                  </Card>

                  {/* Renato Miguel de Moraes */}
                  <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={renatoMImg} alt="Renato Miguel de Moraes" />
                        <AvatarFallback>LG</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Renato Miguel de Moraes</CardTitle>
                      <CardDescription>Assistente de pesquisa e Desenvolvedor de software</CardDescription>
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
                      <a
                        href="http://lattes.cnpq.br/9721643657708654"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/9721643657708654
                      </a>
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
                      <CardDescription>Desenvolvedor de software</CardDescription>
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
                      <a
                        href="http://lattes.cnpq.br/8318645381307182"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/8318645381307182
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </section>

          {/* Histórico de Equipes */}
          <AccordionItem className="border-b-0" value="Historico" data-state="open">
            <AccordionTrigger>
              <h2 className="mb-6 text-2xl font-bold">&gt; Histórico de Equipes</h2>
            </AccordionTrigger>
            <AccordionContent>
              <section className="space-y-8">
                <h3 className="mb-6 text-xl font-bold">Pesquisadoras</h3>

                <section className="space-y-4">
                  {/* Profa. Dra. Ligia Gomes Elliot */}
                  <Card className="opacity-50">
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={ligiaEImg} alt="Profa. Dra. Ligia Gomes Elliot" />
                        <AvatarFallback>LG</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Profa. Dra. Ligia Gomes Elliot</CardTitle>
                      <CardDescription>Pesquisadora</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        PhD em Educação/Avaliação e Mestre em Estudos Latino Americanos pela Universidade da Califórnia Los Angeles, Mestre em
                        Educação pela Universidade Federal do Rio de Janeiro, Coordenadora do Programa de Pós Graduação e do Curso de Mestrado
                        Profissional em Avaliação da Fundação Cesgranrio e pesquisadora do Centro de Avaliação. Pós Doutorado em Avaliação, UFRJ.
                      </p>
                      <p className="italic">Currículo Lattes:</p>
                      <a
                        href="http://lattes.cnpq.br/3407515397492906"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/3407515397492906
                      </a>
                    </CardContent>
                    <CardFooter>Atuou de 2014 até 2021</CardFooter>
                  </Card>

                  {/* Profa. Dra. Lucia Regina Goulart Vilarinho */}
                  <Card className="opacity-50">
                    <CardHeader className="flex flex-row items-center space-x-4">
                      <Avatar className="size-18">
                        <AvatarImage src={luciaVImg} alt="Profa. Dra. Lucia Regina Goulart Vilarinho" />
                        <AvatarFallback>LV</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">Profa. Dra. Lucia Regina Goulart Vilarinho</CardTitle>
                      <CardDescription>Pesquisadora</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">
                        Doutora e Mestre em Educação pela Faculdade de Educação, Universidade Federal do Rio de Janeiro (UFRJ); Pedagoga, pela
                        Pontifícia Universidade Católica do Rio de Janeiro - PUC-Rio; professora aposentada da Faculdade de Educação da Universidade
                        Federal do Rio de Janeiro (UFRJ); professora do PPGE da Universidade Estácio de Sá/RJ (2000-2014), professora do Curso de
                        Mestrado Profissional em Avaliação da Fundação Cesgranrio.
                      </p>
                      <div className="italic">Currículo Lattes:</div>
                      <a
                        href="http://lattes.cnpq.br/1757678864925265"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/1757678864925265
                      </a>
                    </CardContent>
                    <CardFooter>Atuou de 2016 até 2020</CardFooter>
                  </Card>
                  <section>
                    <h3 className="mb-6 text-2xl font-bold">Assistentes de pesquisa e alunos</h3>
                    <ul className="list-inside list-disc space-y-2">
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2023"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2023
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2022"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2022
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2021"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2021
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2020"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2020
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2019"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2019
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2018"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2018
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2017"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2017
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2016"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2016
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2015"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2015
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="quem-somos/historico-equipe/2014"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
                        >
                          Ano 2014
                        </Link>
                      </li>
                    </ul>
                  </section>
                </section>

                {/* Seção de Designer do Logo */}
                <section>
                  <h3 className="mb-6 text-xl font-bold">Designer do logotipo</h3>
                  <Card className="opacity-50">
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
                      <a
                        href="http://lattes.cnpq.br/4407621365289182"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline hover:underline-offset-4"
                      >
                        http://lattes.cnpq.br/4407621365289182
                      </a>
                    </CardContent>
                  </Card>
                </section>
              </section>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Layout>
  );
}
