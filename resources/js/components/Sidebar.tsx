import { NavLink } from 'react-router-dom'
import {
  Activity,
  Bell,
  Briefcase,
  Calendar,
  Code,
  Database,
  Eye,
  FileText,
  Globe,
  Inbox,
  Layers,
  Mail,
  Server,
  Shield,
  Terminal,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from 'lucide-react'

type NavItem = {
  to: string
  label: string
  Icon: LucideIcon
  count?: number | string
  danger?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Watchers',
    items: [
      { to: '/requests', label: 'Requests', Icon: Activity },
      { to: '/commands', label: 'Commands', Icon: Terminal },
      { to: '/schedule', label: 'Schedule', Icon: Calendar },
      { to: '/jobs', label: 'Jobs', Icon: Briefcase },
      { to: '/batches', label: 'Batches', Icon: Layers },
    ],
  },
  {
    title: 'Data',
    items: [
      { to: '/queries', label: 'Queries', Icon: Database },
      { to: '/models', label: 'Models', Icon: Code },
      { to: '/cache', label: 'Cache', Icon: Zap },
      { to: '/redis', label: 'Redis', Icon: Server },
      { to: '/logs', label: 'Logs', Icon: FileText },
    ],
  },
  {
    title: 'Diagnostics',
    items: [
      { to: '/exceptions', label: 'Exceptions', Icon: TriangleAlert, danger: true },
      { to: '/dumps', label: 'Dumps', Icon: Inbox },
      { to: '/client-requests', label: 'HTTP Client', Icon: Globe },
      { to: '/mail', label: 'Mail', Icon: Mail },
      { to: '/notifications', label: 'Notifications', Icon: Bell },
      { to: '/gates', label: 'Gates', Icon: Shield },
      { to: '/events', label: 'Events', Icon: Activity },
      { to: '/views', label: 'Views', Icon: Eye },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      {SECTIONS.map((section) => (
        <div key={section.title} className="sidebar__section">
          <div className="sidebar__section-label">{section.title}</div>
          <nav className="sidebar__nav">
            {section.items.map(({ to, label, Icon, count, danger }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'sidebar__item',
                    isActive ? 'is-active' : '',
                    danger ? 'is-danger' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
              >
                <Icon size={15} strokeWidth={2} className="sidebar__icon" />
                <span className="sidebar__label">{label}</span>
                {count !== undefined && <span className="sidebar__count">{count}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  )
}
