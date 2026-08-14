import { useRef, useState } from 'react'
import { MAX_TAG_LEN, MAX_TAGS } from '../utils/constants'
import { fieldStyle } from '../ui'
import { useT } from '../i18n'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  /** Previously-used tags to offer as autocomplete suggestions. */
  suggestions: string[]
  disabled?: boolean
  placeholder?: string
}

const MAX_SUGGESTIONS = 8

/**
 * Chips-with-autocomplete tag editor. Selected tags render as removable
 * chips; typing filters the `suggestions` dropdown; Enter / comma commit the
 * current text, Backspace on an empty field removes the last chip.
 */
export default function TagInput({ value, onChange, suggestions, disabled, placeholder }: TagInputProps) {
  const { t } = useT()
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const q = text.trim().toLowerCase()
  const filtered = suggestions
    .filter(s => !value.includes(s) && (!q || s.toLowerCase().includes(q)))
    .slice(0, MAX_SUGGESTIONS)

  function addTag(raw: string) {
    const tag = raw.trim().slice(0, MAX_TAG_LEN)
    setText('')
    setActive(0)
    if (!tag || value.includes(tag) || value.length >= MAX_TAGS) return
    onChange([...value, tag])
  }

  function removeTag(tag: string) {
    onChange(value.filter(x => x !== tag))
  }

  function handleChange(v: string) {
    // A comma commits the text before it and keeps the rest for typing.
    const comma = v.indexOf(',')
    if (comma >= 0) {
      addTag(v.slice(0, comma))
      setText(v.slice(comma + 1))
    } else {
      setText(v)
    }
    setOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && filtered[active]) addTag(filtered[active])
      else addTag(text)
    } else if (e.key === 'Backspace' && !text && value.length) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'ArrowDown' && filtered.length) {
      e.preventDefault()
      setOpen(true)
      setActive(a => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp' && filtered.length) {
      e.preventDefault()
      setActive(a => Math.max(a - 1, 0))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <div
        onClick={() => !disabled && inputRef.current?.focus()}
        className="w-full flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-[10px] text-sm cursor-text"
        style={{ ...fieldStyle, opacity: disabled ? 0.6 : 1 }}
      >
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs pl-2 pr-1 py-px rounded-md"
            style={{ background: 'var(--panel)', color: 'var(--ink-dim)', border: '1px solid var(--line)' }}
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeTag(tag) }}
                aria-label={t('removeTag')}
                className="w-4 h-4 flex items-center justify-center rounded-[4px] leading-none transition-colors hover:text-[color:var(--ink)]"
                style={{ color: 'var(--ink-mute)' }}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={disabled}
          placeholder={value.length ? '' : (placeholder ?? t('addTag'))}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          className="flex-1 min-w-[80px] bg-transparent outline-none py-1"
          style={{ color: 'var(--ink)' }}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          className="absolute z-20 left-0 right-0 mt-1 py-1 rounded-[10px] max-h-52 overflow-auto shadow-lg"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line-strong)' }}
        >
          {filtered.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { addTag(s); inputRef.current?.focus() }}
                onMouseEnter={() => setActive(i)}
                className="w-full text-left px-3 py-1.5 text-sm transition-colors"
                style={{
                  background: i === active ? 'var(--accent-bg)' : 'transparent',
                  color: i === active ? 'var(--accent)' : 'var(--ink)',
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
