import { Outlet, useLocation } from 'react-router-dom'

export function AppShell() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main
        key={location.pathname}
        className="max-w-[520px] mx-auto px-6 min-h-screen animate-fade-in"
      >
        <Outlet />
      </main>
    </div>
  )
}
