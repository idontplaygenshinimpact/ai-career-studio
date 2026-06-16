import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteNav } from "@/components/SiteNav";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Career Studio",
  description: "AI 求职训练工作台，包含简历诊断、项目优化和模拟面试追问。",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <meta name="theme-color" content="#020617" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-full bg-slate-950 text-slate-100">
        <SiteNav />
        {children}
        <ServiceWorkerRegister />
        <SpeedInsights />
      </body>
    </html>
  );
}
