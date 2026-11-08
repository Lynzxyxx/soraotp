import './globals.css'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--f-sans', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--f-mono', display: 'swap' })
export const metadata = { title: 'SoraOTP', description: 'Website untuk beli nokos disemua platform' }
export default function L({ children }) { return <html lang="id" className={sans.variable + ' ' + mono.variable} data-theme="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('sora_theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t}catch(e){}" }} /></head><body>{children}</body></html> }
