// 카드 오브젝트 — 모든 종류 공용. 레퍼런스 카드 템플릿 톤(헤더띠 + 본문 + 하단 라벨).
const KIND_LABEL = {
  impulse: '충동',
  thought: '생각',
  action: '실천',
  overuse: '과몰입 행동',
  coin: '생각하는 힘',
}

export default function Card({ kind = 'impulse', text, footer, badge, selected, disabled, ghost, onClick, size = 'md' }) {
  const cls = [
    'gcard', `gcard-${kind}`, `gcard-${size}`,
    selected ? 'is-selected' : '', disabled ? 'is-disabled' : '', ghost ? 'is-ghost' : '',
    onClick ? 'is-clickable' : '',
  ].join(' ').trim()
  return (
    <div className={cls} onClick={disabled ? undefined : onClick}>
      <div className="gcard-head">{KIND_LABEL[kind] || ''}</div>
      <div className="gcard-body">{ghost ? '' : text}</div>
      {badge != null && <div className="gcard-badge">{badge}</div>}
      {footer && <div className="gcard-foot">{footer}</div>}
    </div>
  )
}

// 더미(덱/버린덱) — 쌓인 카드 뒷면
export function CardPile({ label, count, faceDown }) {
  return (
    <div className="cardpile">
      <div className={'cardpile-stack' + (faceDown ? ' down' : '')}>
        <span className="cardpile-count">{count}</span>
      </div>
      <div className="cardpile-label">{label}</div>
    </div>
  )
}
