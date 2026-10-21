import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Đăng nhập", template: "%s | HN LMS" },
  description: "Đăng nhập vào không gian học tập và vận hành HN LMS.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="authBoundary">{children}</div>;
}
