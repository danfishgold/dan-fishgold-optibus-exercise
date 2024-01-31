import { Duty, Warning, warningText } from './utils/duties'

export function DutyCard({
  duty,
  onClick,
  warning,
}: {
  duty: Duty
  onClick: () => void
  warning: Warning | null
}) {
  const time = formatter.formatRange(duty.start, duty.end)
  const warningDescription =
    warning !== null ? `Warning: ${warningText(warning)}` : ''
  const description = `${duty.name} from ${duty.depot}. On ${time}. ${warningDescription}`
  return (
    <li>
      <button
        onClick={onClick}
        aria-disabled={warning !== null}
        aria-label={duty.name}
        aria-description={description}
      >
        <span>
          <strong>{`${duty.name} | ${duty.depot}`}</strong>
        </span>
        <time>{formatter.formatRange(duty.start, duty.end)}</time>
        {warning && <span>{`⚠︎ ${warningText(warning)}`}</span>}
      </button>
    </li>
  )
}

const formatter = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
})
