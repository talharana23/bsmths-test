import './globals.css'

export const metadata = {
  title: 'ExamPro — Online Exam System',
  description: 'Secure online examination platform with anti-cheating enforcement',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="gradient-bg min-h-screen">
        {children}
      </body>
    </html>
  )
}
