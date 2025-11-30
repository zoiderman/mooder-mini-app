// app/layout.tsx
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Mooder",
  description: "AI підбирає музику під твій настрій",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}