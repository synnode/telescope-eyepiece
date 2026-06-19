import { Download } from 'lucide-react'
import { MetricGrid, type Metric } from '../../components/MetricGrid'
import {
  api,
  type EntryShowResponse,
  type MailAddressMap,
  type MailEntryContent,
} from '../../lib/api'
import { formatRelative } from '../../lib/format'

type Props = {
  detail: EntryShowResponse<MailEntryContent>
}

export function MailDetailBody({ detail }: Props) {
  const { entry } = detail
  const { content } = entry
  const previewUrl = api.mail.previewUrl(entry.id)
  const downloadUrl = api.mail.downloadUrl(entry.id)

  const metrics: Metric[] = [
    { label: 'Mailable', value: shortClass(content.mailable), tone: 'small' },
    { label: 'Queued', value: content.queued ? 'Yes' : 'No' },
    { label: 'When', value: formatRelative(entry.created_at), tone: 'small' },
  ]

  return (
    <div className="request-detail">
      <MetricGrid metrics={metrics} />

      <RecipientsBlock content={content} />

      <section className="detail-section">
        <div className="detail-section__label">
          Preview
          <a
            className="detail-section__action"
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={11} />
            .eml
          </a>
        </div>
        <iframe
          className="mail-preview"
          title="Mail preview"
          src={previewUrl}
          sandbox="allow-same-origin"
        />
      </section>
    </div>
  )
}

function RecipientsBlock({ content }: { content: MailEntryContent }) {
  const rows: Array<[string, MailAddressMap | undefined]> = [
    ['from', content.from],
    ['to', content.to],
    ['cc', content.cc],
    ['bcc', content.bcc],
    ['reply-to', content.replyTo],
  ]
  const present = rows.filter(([, map]) => map && Object.keys(map).length > 0)
  if (present.length === 0) return null
  return (
    <section className="detail-section">
      <div className="detail-section__label">Recipients</div>
      <div className="kv-list">
        {present.map(([label, map]) => (
          <div key={label} className="kv-row">
            <div className="kv-row__key">{label}</div>
            <div className="kv-row__value">{renderAddresses(map!)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function renderAddresses(map: MailAddressMap): string {
  return Object.entries(map)
    .map(([email, name]) => (name ? `${name} <${email}>` : email))
    .join(', ')
}

function shortClass(fqcn?: string): string {
  if (!fqcn) return '—'
  const parts = fqcn.split('\\')
  return parts[parts.length - 1] || fqcn
}
