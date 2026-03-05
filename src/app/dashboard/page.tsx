"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuthStore();
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Basic route protection
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchDashboardData = async () => {
            try {
                // Here we hit the portfolio service through the API gateway.
                // Using /api/portfolios/user/{userId} as an example, adjust according to your exact mapping.
                // If portfolio service requires user ID from JWT, your backend might abstract this,
                // but for now let's assume a generic /api/portfolios/my-portfolio route exists,
                // or we try to fetch via a known endpoint.

                // As a placeholder until we confirm the exact Portfolio Service endpoint:
                // const response = await api.get('/api/portfolios/summary');
                // setPortfolioData(response.data);

                // Simulating a delay for UX
                setTimeout(() => {
                    setPortfolioData({
                        balance: 24500.50,
                        activeTrades: 3,
                        todayPnl: 450.20
                    });
                    setLoading(false);
                }, 1000);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                // If unauthorized, token might be expired
                if ((error as any).response?.status === 401) {
                    logout();
                    router.push("/login");
                }
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [isAuthenticated, router, logout]);

    if (!isAuthenticated || loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                    <p className="text-muted-foreground">Loading your portfolio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back. Here is your trading overview.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Balance Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${portfolioData?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ready for trading
                        </p>
                    </CardContent>
                </Card>

                {/* P&L Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today&apos;s P&amp;L</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center text-emerald-500">
                            <ArrowUpRight className="h-5 w-5 mr-1" />
                            ${portfolioData?.todayPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +1.8% from yesterday
                        </p>
                    </CardContent>
                </Card>

                {/* Active Trades Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Open Trades</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{portfolioData?.activeTrades}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across 2 distinct assets
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Future space for charts/tables */}
            <div className="mt-8 grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="col-span-1 lg:col-span-4 min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your latest trades and transactions.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center text-muted-foreground h-64">
                        Transaction history will appear here.
                    </CardContent>
                </Card>

                <Card className="col-span-1 lg:col-span-3 min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Market Movers</CardTitle>
                        <CardDescription>Top trending pairs right now.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center text-muted-foreground h-64">
                        Market data feed will appear here.
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
