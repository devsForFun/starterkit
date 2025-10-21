"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Route } from "@/components/app-layouts/layout-one/routes"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavMain({
  items,
}: {
  items: Route[]
}) {
  const pathname = usePathname()
  const isActive = (url: string) => pathname.includes(url)
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-lg font-bold text-center w-full mb-4 text-nowrap">waitlists</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild isActive={isActive(item.url)}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup >
    </>
  )
}
