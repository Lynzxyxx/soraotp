'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from '@/components/Icons'
export default function ThemeToggle() {
  const [t, setT] = useState('dark')
  useEffect(() => { setT(document.documentElement.dataset.theme || 'dark') }, [])
  function flip() {
    const n = t === 'dark' ? 'light' : 'dark'
    setT(n); document.documentElement.dataset.theme = n
    try { localStorage.setItem('sora_theme', n) } catch {}
  }
  return <button className="ib" onClick={flip} aria-label={t === 'dark' ? 'Mode terang' : 'Mode gelap'} title={t === 'dark' ? 'Mode terang' : 'Mode gelap'}>{t === 'dark' ? <Sun /> : <Moon />}</button>
}
