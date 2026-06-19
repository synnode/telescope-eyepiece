import { useLocation } from 'react-router-dom'

export function PlaceholderScreen() {
  const { pathname } = useLocation()
  return (
    <section>
      <h1 style={{ textTransform: 'capitalize' }}>{pathname.replace('/', '')}</h1>
      <p className="state">
        Not implemented yet. This is the Eyepiece skeleton — drop your design&apos;s screen here.
      </p>
    </section>
  )
}
