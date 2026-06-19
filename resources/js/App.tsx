import { useState } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { RequestsScreen } from './screens/Requests'
import { PlaceholderScreen } from './screens/Placeholder'
import { api } from './lib/api'

export type ShellContext = {
  isPolling: boolean
}

function Shell() {
  const [isPolling, setIsPolling] = useState(true)
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
      />
      <div className="app-body">
        <Sidebar />
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
        <Route path="*" element={<PlaceholderScreen />} />
      </Route>
    </Routes>
  )
}
