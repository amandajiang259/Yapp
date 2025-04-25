import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profile | Yapp",
};

export default function EditProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 