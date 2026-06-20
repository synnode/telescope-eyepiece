import { useState } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { useTheme } from './lib/theme'
import { RequestsScreen } from './screens/Requests'
import { QueriesScreen } from './screens/Queries'
import { ExceptionsScreen } from './screens/Exceptions'
import { LogsScreen } from './screens/Logs'
import { JobsScreen } from './screens/Jobs'
import { CommandsScreen } from './screens/Commands'
import { MailScreen } from './screens/Mail'
import { CacheScreen } from './screens/Cache'
import { RedisScreen } from './screens/Redis'
import { ViewsScreen } from './screens/Views'
import { ModelsScreen } from './screens/Models'
import { NotificationsScreen } from './screens/Notifications'
import { EventsScreen } from './screens/Events'
import { GatesScreen } from './screens/Gates'
import { ScheduleScreen } from './screens/Schedule'
import { ClientRequestsScreen } from './screens/ClientRequests'
import { BatchesScreen } from './screens/Batches'
import { DumpsScreen } from './screens/Dumps'
import { MonitoredTagsScreen } from './screens/MonitoredTags'
import { PlaceholderScreen } from './screens/Placeholder'
import { api } from './lib/api'

export type ShellContext = {
  isPolling: boolean
}

function Shell() {
  const [isPolling, setIsPolling] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const queryClient = useQueryClient()

  return (
    <div className="app">
      <Header
        isPolling={isPolling}
        onPauseToggle={() => setIsPolling((p) => !p)}
        onClear={async () => {
          await api.clearEntries()
          await queryClient.invalidateQueries()
        }}
        onRefresh={() => queryClient.invalidateQueries()}
        onMenuToggle={() => setIsSidebarOpen((open) => !open)}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      <div className="app-body">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="main">
          <Outlet context={{ isPolling } satisfies ShellContext} />
        </main>
      </div>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<RequestsScreen />} />
        <Route path="/requests" element={<RequestsScreen />} />
        <Route path="/queries" element={<QueriesScreen />} />
        <Route path="/exceptions" element={<ExceptionsScreen />} />
        <Route path="/logs" element={<LogsScreen />} />
        <Route path="/jobs" element={<JobsScreen />} />
        <Route path="/commands" element={<CommandsScreen />} />
        <Route path="/mail" element={<MailScreen />} />
        <Route path="/cache" element={<CacheScreen />} />
        <Route path="/redis" element={<RedisScreen />} />
        <Route path="/views" element={<ViewsScreen />} />
        <Route path="/models" element={<ModelsScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/events" element={<EventsScreen />} />
        <Route path="/gates" element={<GatesScreen />} />
        <Route path="/schedule" element={<ScheduleScreen />} />
        <Route path="/client-requests" element={<ClientRequestsScreen />} />
        <Route path="/batches" element={<BatchesScreen />} />
        <Route path="/dumps" element={<DumpsScreen />} />
        <Route path="/monitored-tags" element={<MonitoredTagsScreen />} />
        <Route path="*" element={<PlaceholderScreen />} />
      </Route>
    </Routes>
  )
}
