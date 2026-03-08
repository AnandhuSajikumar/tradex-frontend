"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Hydration check to prevent flash of unauthorized content
        const checkAuth = () => {
            if (!isAuthenticated) {
                router.push("/login");
            } else if (user?.role !== "ADMIN") {
                router.push("/dashboard"); // Redirect normal users
            } else {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [isAuthenticated, user, router]);

    if (isChecking) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-gray-50/50">
            {children}
        </div>
    );
}
