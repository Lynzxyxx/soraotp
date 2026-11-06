'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
export default function Cta({ className = 'btn' }) {
  const [on, setOn] = useState(false)
  useEffect(() => onAuthStateChanged(auth, u => setOn(!!u)), [])
  return <Link className={className} href={on ? '/dashboard' : '/login'}>{on ? 'Dashboard' : 'Masuk / Daftar'}</Link>
}
