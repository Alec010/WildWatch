'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function AuthErrorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorMessage = searchParams.get('message') || 'An error occurred during authentication';

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-[1200px] mx-auto p-4">
                    <Image
                        src="/logo.png"
                        alt="WildWatch Logo"
                        width={150}
                        height={50}
                    />
                </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <h1 className="text-2xl font-semibold text-[#8B0000] mb-4">Authentication Error</h1>
                    <p className="text-gray-600 mb-6">{errorMessage}</p>
                    <div className="space-y-4">
                        <Button
                            onClick={() => router.push('/login')}
                            className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white"
                        >
                            Return to Login
                        </Button>
                        <Button
                            onClick={() => router.push('/')}
                            variant="outline"
                            className="w-full"
                        >
                            Go to Home
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 