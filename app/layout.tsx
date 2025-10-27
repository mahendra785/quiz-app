import Providers from "./components/providers";
import EnsureUserOnLogin from "./components/ensureonlogin";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <EnsureUserOnLogin />
          {children}
        </Providers>
      </body>
    </html>
  );
}
