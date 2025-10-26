// e.g., in app/layout.tsx (or app/(www)/layout.tsx)
import Providers from "./components/providers";
import EnsureUserOnLogin from "./components/ensureonlogin";
import "./globals.css";
import Nav from "./components/nav";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <EnsureUserOnLogin />
          {children}
        </Providers>
      </body>
    </html>
  );
}
