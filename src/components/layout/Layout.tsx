import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <main className="flex-1 mr-56 min-h-screen overflow-x-hidden">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
