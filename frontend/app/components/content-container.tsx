import React from "react";

export default function ContentContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-t-md p-8 bg-gray-100 h-full min-h-[calc(100vh)]">
      {children}
    </div>
  );
}
