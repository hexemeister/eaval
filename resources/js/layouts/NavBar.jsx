import { Link } from '@inertiajs/react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"

export function NavBar() {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/quem-somos">Quem somos</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/sobre">Sobre o projeto</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Relatórios Técnicos</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid whitespace-nowrap gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2023-2024.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2023-2024
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2022.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2022
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2021.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2021
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2020.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2020
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2019.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2019
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2018.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2018
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2017.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2017
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2016.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2016
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2015-2016.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2015-2016
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a 
                  href="/storage/relatorios/Estado_da_arte_de_avaliacao_2014.pdf"
                  target='_blank'
                  >   
                    Relatório Técnico 2014
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink>Pesquisa</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink>Publicações</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Estatísticas</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink>Link</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/contato">Contato</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}