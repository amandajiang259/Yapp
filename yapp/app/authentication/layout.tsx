import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | Yapp",
};

export default function AuthenticationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 