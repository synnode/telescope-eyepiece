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
  Tag,
  Terminal,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { formatCount } from '../lib/format'

type NavItem = {
  to: string
  label: string
  Icon: LucideIcon
  countKey?: string
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
      { to: '/requests', label: 'Requests', Icon: Activity, countKey: 'request' },
      { to: '/commands', label: 'Commands', Icon: Terminal, countKey: 'command' },
      { to: '/schedule', label: 'Schedule', Icon: Calendar, countKey: 'schedule' },
      { to: '/jobs', label: 'Jobs', Icon: Briefcase, countKey: 'job' },
      { to: '/batches', label: 'Batches', Icon: Layers, countKey: 'batch' },
    ],
  },
  {
    title: 'Data',
    items: [
      { to: '/queries', label: 'Queries', Icon: Database, countKey: 'query' },
      { to: '/models', label: 'Models', Icon: Code, countKey: 'model' },
      { to: '/cache', label: 'Cache', Icon: Zap, countKey: 'cache' },
      { to: '/redis', label: 'Redis', Icon: Server, countKey: 'redis' },
      { to: '/logs', label: 'Logs', Icon: FileText, countKey: 'log' },
    ],
  },
  {
    title: 'Diagnostics',
    items: [
      { to: '/exceptions', label: 'Exceptions', Icon: TriangleAlert, danger: true, countKey: 'exception' },
      { to: '/dumps', label: 'Dumps', Icon: Inbox, countKey: 'dump' },
      { to: '/client-requests', label: 'HTTP Client', Icon: Globe, countKey: 'client_request' },
      { to: '/mail', label: 'Mail', Icon: Mail, countKey: 'mail' },
      { to: '/notifications', label: 'Notifications', Icon: Bell, countKey: 'notification' },
      { to: '/gates', label: 'Gates', Icon: Shield, countKey: 'gate' },
      { to: '/events', label: 'Events', Icon: Activity, countKey: 'event' },
      { to: '/views', label: 'Views', Icon: Eye, countKey: 'view' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { to: '/monitored-tags', label: 'Monitored Tags', Icon: Tag },
    ],
  },
]

type Props = {
  isOpen: boolean
  onClose: () => void
  counts?: Record<string, number>
}

export function Sidebar({ isOpen, onClose, counts }: Props) {
  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={'sidebar' + (isOpen ? ' is-open' : '')}>
        {SECTIONS.map((section) => (
          <div key={section.title} className="sidebar__section">
            <div className="sidebar__section-label">{section.title}</div>
            <nav className="sidebar__nav">
              {section.items.map(({ to, label, Icon, countKey, danger }) => {
                const count = countKey ? counts?.[countKey] : undefined
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
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
                    {count !== undefined && count > 0 && (
                      <span className="sidebar__count">{formatCount(count)}</span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        ))}
      </aside>
    </>
  )
}
