import { IBM_Plex_Mono } from 'next/font/google'
import localFont from 'next/font/local'

// SVN-Gotham - licensed family, SPEC §12.3
export const gotham = localFont({
  src: [
    {
      path: '../fonts/svn-gotham/SVN-Gotham-Book.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/svn-gotham/SVN-Gotham-Book-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/svn-gotham/SVN-Gotham-Regular.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/svn-gotham/SVN-Gotham-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/svn-gotham/SVN-Gotham-Black.otf',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-gotham',
  display: 'swap',
  fallback: [
    'Montserrat',
    'Helvetica Neue',
    'Helvetica',
    'Arial',
    'sans-serif',
  ],
})

export const plexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plex-mono',
  display: 'swap',
})
