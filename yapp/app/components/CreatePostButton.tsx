"use client";

import Link from 'next/link';

export default function CreatePostButton() {
  return (
    <Link
      href="/dashboard/create-post"
      className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      Create Post
    </Link>
  );
} 