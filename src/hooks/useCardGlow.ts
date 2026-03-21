import { useEffect } from 'react'

export function useCardGlow(selector = '.card-glow') {
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(selector)

    const handleMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      card.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }

    cards.forEach(card => card.addEventListener('mousemove', handleMouseMove))
    return () => cards.forEach(card => card.removeEventListener('mousemove', handleMouseMove))
  }, [selector])
}
