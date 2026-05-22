import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Trình thu thập dữ liệu web & Trích xuất thông tin liên hệ thông minh",
  description: "Trình thu thập dữ liệu web và trích xuất thông tin liên hệ được tối ưu hóa bởi AI. Trích xuất email, số điện thoại, người liên hệ và hình ảnh được phân loại phục vụ tiếp thị sử dụng Google Gemini 2.5 Flash.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50`}
      >
        {children}
      </body>
    </html>
  );
}
