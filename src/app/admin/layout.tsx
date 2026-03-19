// app/admin/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MOQHUBS Admin",
  description: "MOQHUBS Admin Dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}