import "./globals.css";
import { Providers } from "../lib/providers";

// Application metadata for SEO and browser display
export const metadata = {
  title: "OAS - Oral Assessment System",
  description: "Web-based oral assessment platform for universities",
};

/**
 * Root Layout Component
 *
 * The main layout wrapper for the entire application.
 * Sets up fonts, global styles, and providers for state management.
 * All pages in the app are rendered within this layout.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Font Awesome icons used throughout the application */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="font-geist antialiased">
        {/* Providers wrap the app with React Query and other context providers */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
