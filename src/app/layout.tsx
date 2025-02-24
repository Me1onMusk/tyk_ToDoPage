
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "config/material-tailwind-theme-provider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

// 메타데이터 정의 // 
export const metadata: Metadata = {
    title: "To-Do Boards",
    description: "드래그 앤 드롭이 가능한 To-Do 보드 앱",
    // 필요한 추가 메타 태그 (openGraph, twitter, icons 등)도 가능
    openGraph: {
      title: "To-Do Boards",
      description: "드래그 앤 드롭이 가능한 To-Do 보드 앱",
      siteName: "My ToDo App",
      locale: "ko_KR",
      type: "website",
    },
}; 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
        <html lang="en">
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css"
                    integrity="sha512-MV7K8+y+gLIBoVD59lQIYicR65iaqukzvf/nwasF0nqhPay5w/9lJmVM2hMDcnK1OnMGCdVK+iQrJ7lzPJQd1w=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer" />
            </head>
            <body className={ inter.className }>
                <nav className="bg-gray-800 text-white p-4">
                <div className="max-w-6xl mx-auto flex gap-4">
                    <Link href="/" className="hover:underline">홈</Link>
                    <Link href="/search" className="hover:underline">검색</Link>
                </div>
                </nav>
                { children }
            </body>
        </html>
    </ThemeProvider>
  );
};