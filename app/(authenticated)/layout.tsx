import SidebarWrapper from '@/components/SidebarWrapper'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <SidebarWrapper>{children}</SidebarWrapper>
}
