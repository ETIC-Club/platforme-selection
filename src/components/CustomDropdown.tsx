'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './CustomDropdown.module.css'

interface Option {
  label: string
  value: string
  color?: string
  bgColor?: string
}

interface CustomDropdownProps {
  options: Option[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select',
  className = '',
  style,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredValue, setHoveredValue] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      className={`${styles.container} ${className}`} 
      ref={dropdownRef}
      style={style}
    >
      <div 
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          color: selectedOption?.color || '#4B5563',
          backgroundColor: selectedOption?.bgColor || '#E5E7EB',
          fontWeight: selectedOption ? 600 : 400
        }}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <span className={styles.arrow} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', display: 'flex', alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className={styles.menu}>
          {options.map((opt) => {
            const isActiveOrHovered = hoveredValue === opt.value || opt.value === value
            return (
              <div
                key={opt.value}
                className={styles.menuItem}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                onMouseEnter={() => setHoveredValue(opt.value)}
                onMouseLeave={() => setHoveredValue(null)}
                style={{ 
                  color: opt.color || '#272421',
                  backgroundColor: isActiveOrHovered ? (opt.bgColor || '#f0f1f3') : 'transparent',
                  fontWeight: opt.value === value ? 700 : 500
                }}
              >
                {opt.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
