"use client";

interface PageLoaderProps {
  pageTitle: string;
  subtitle?: string | null;
}

export function PageLoader({ pageTitle, subtitle }: PageLoaderProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#f8f5f5] to-[#fff9f9]">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-[#DAA520] animate-spin [animation-delay:150ms]"></div>
          <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-[#8B0000] animate-spin [animation-delay:300ms]"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">
          Loading your {pageTitle}...
        </p>
        {subtitle && (
          <p className="mt-2 text-gray-500 text-sm">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

