import './globals.css'

export const metadata = {
  title: 'Il Cerchio delle Note',
  description: 'Trainer per la scala musicale',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}