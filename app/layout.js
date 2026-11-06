import './globals.css'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--f-sans', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--f-mono', display: 'swap' })
export const metadata = { title: 'SoraOTP', description: 'Nomor virtual yang fast resp ' }
export default function L({ children }) { return <html lang="id" className={sans.variable + ' ' + mono.variable}><body>{children}</body></html> }
