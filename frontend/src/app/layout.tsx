import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";

export const metadata: Metadata = { title: "Airbnb clone – Holiday rentals, cabins, beach houses & more", description: "Browse, book and host stays." };

const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t;else if(matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <footer className="footer"><span>© 2026 Airbnb clone (demo project)</span><span>Payments, messaging and ID verification are mocked – Coming soon</span></footer>
        </Providers>
      </body>
    </html>
  );
}
