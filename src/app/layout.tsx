import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Race My Rival",
  description: "Turn times into races.",
  icons: {
    icon: [
      { url: "/brand/rmr-favicon-with-lines.svg", type: "image/svg+xml" },
      { url: "/brand/rmr-favicon-with-lines-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/rmr-favicon-with-lines-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/brand/rmr-favicon-with-lines-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
