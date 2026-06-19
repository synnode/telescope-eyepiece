import { NavLink, Route, Routes } from 'react-router-dom'
import { RequestsScreen } from './screens/Requests'
import { PlaceholderScreen } from './screens/Placeholder'

const NAV = [
  { to: '/requests', label: 'Requests' },
  { to: '/commands', label: 'Commands' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/exceptions', label: 'Exceptions' },
  { to: '/logs', label: 'Logs' },
  { to: '/queries', label: 'Queries' },
  { to: '/mail', label: 'Mail' },
  { to: '/cache', label: 'Cache' },
  { to: '/redis', label: 'Redis' },
  { to: '/models', label: 'Models' },
  { to: '/events', label: 'Events' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/gates', label: 'Gates' },
  { to: '/views', label: 'Views' },
  { to: '/dumps', label: 'Dumps' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/batches', label: 'Batches' },
  { to: '/client-requests', label: 'HTTP Client' },
]

export function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Eyepiece</div>
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<RequestsScreen />} />
          <Route path="/requests" element={<RequestsScreen />} />
          <Route path="*" element={<PlaceholderScreen />} />
        </Routes>
      </main>
    </div>
  )
}
