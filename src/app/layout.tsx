import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Career Studio",
  description: "AI 求职训练工作台，包含简历诊断、项目优化和模拟面试追问。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
