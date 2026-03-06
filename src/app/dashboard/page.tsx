"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { Megaphone, Receipt, BarChart3, Globe } from "lucide-react";

// Mock helper to generate realistic looking percentage changes based on symbol name
const getMockChange = (symbol: string, price: number) => {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const isPositive = hash % 2 === 0;
    const changePercent = (Math.abs(hash % 1000) / 100);
    const changeAmount = price * (changePercent / 100);
    return {
        isPositive,
        changePercent: changePercent.toFixed(2),
        changeAmount: changeAmount.toFixed(2)
    };
};

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, logout } = useAuthStore();
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [marketData, setMarketData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchDashboardData = async () => {
            try {
                const marketResponse = await api.get('/v1/api/market/all');
                const sortedData = [...marketResponse.data].sort((a, b) => a.symbol.localeCompare(b.symbol));
                setMarketData(sortedData);

                setTimeout(() => {
                    setPortfolioData({
                        currentValue: 24500.50,
                        investedAmount: 22000.00,
                        onedayReturnAmt: -121.00,
                        onedayReturnPct: -1.36,
                        totalReturnAmt: 2500.50,
                        totalReturnPct: 11.36,
                    });
                    setLoading(false);
                }, 500);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                if ((error as any).response?.status === 401) {
                    logout();
                    router.push("/login");
                }
                setLoading(false);
            }
        };

        fetchDashboardData();

        const intervalId = setInterval(async () => {
            try {
                const marketResponse = await api.get('/v1/api/market/all');
                const sortedData = [...marketResponse.data].sort((a, b) => a.symbol.localeCompare(b.symbol));
                setMarketData(sortedData);
            } catch (error) {
                console.error("Failed to poll market data:", error);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [isAuthenticated, router, logout]);

    if (!isAuthenticated || loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                    <p className="text-muted-foreground mt-2">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (val: number) => "$" + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const mostTraded = marketData.slice(0, 4);
    const topMovers = marketData.slice(4);

    return (
        <div className="min-h-screen bg-background pb-12 animate-in fade-in duration-500">
            {/* Index Ticker Top Bar */}
            <div className="border-b bg-card">
                <div className="container overflow-x-auto whitespace-nowrap py-3 flex gap-8 text-sm font-medium" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {["NIFTY 24,467.30", "SENSEX 78,973.65", "BANKNIFTY 57,777.15", "MIDCPNIFTY 13,174.35", "FINNIFTY 26,001.00"].map((idx, i) => (
                        <div key={i} className="flex gap-2 items-center text-muted-foreground">
                            <span>{idx.split(" ")[0]}</span>
                            <span className="text-foreground">{idx.split(" ")[1]}</span>
                            <span className="text-red-500">-1.20%</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="container mt-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                {/* Main Content Left */}
                <div className="flex flex-col gap-8">

                    {/* Most Traded Stocks Section */}
                    <section>
                        <h2 className="text-xl font-semibold mb-6 text-foreground">Most traded stocks on TradeX</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
                            {mostTraded.map((stock) => {
                                const { isPositive, changeAmount, changePercent } = getMockChange(stock.symbol, stock.price);
                                return (
                                    <div key={stock.symbol} className="border bg-card rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow cursor-pointer min-w-[200px] flex-shrink-0">
                                        <div className="h-12 w-12 rounded-full border flex items-center justify-center mb-4 bg-secondary/50 text-primary font-bold shadow-sm">
                                            {stock.symbol.substring(0, 2)}
                                        </div>
                                        <h3 className="text-sm font-medium mb-5 text-muted-foreground line-clamp-1">{stock.symbol}</h3>
                                        <div className="mt-auto">
                                            <div className="text-lg font-bold tracking-tight mb-1">{formatCurrency(stock.price)}</div>
                                            <div className={`text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {isPositive ? '+' : '-'}${changeAmount} ({changePercent}%)
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Top Movers Today Section */}
                    <section className="mt-4">
                        <h2 className="text-xl font-semibold mb-6 text-foreground">Top movers today</h2>

                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                            {["Gainers", "Losers", "Volume shockers", "S&P 500"].map((tab, i) => (
                                <button key={i} className={`px-5 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-colors ${i === 0 ? 'bg-secondary text-primary border-primary/20 shadow-sm' : 'bg-transparent text-muted-foreground hover:bg-secondary/50'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="border rounded-2xl bg-card overflow-hidden">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 border-b text-xs font-medium text-muted-foreground bg-secondary/10">
                                <div>Company</div>
                                <div className="text-right w-24">Market price</div>
                                <div className="text-right w-20">Action</div>
                            </div>
                            <div className="divide-y max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                                {topMovers.map((stock) => {
                                    const { isPositive, changePercent } = getMockChange(stock.symbol, stock.price);
                                    return (
                                        <div key={stock.symbol} className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 items-center hover:bg-secondary/30 cursor-pointer transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="h-9 w-9 flex-shrink-0 rounded bg-secondary flex items-center justify-center text-xs font-bold text-primary">
                                                    {stock.symbol.charAt(0)}
                                                </div>
                                                <div className="font-semibold text-sm truncate">{stock.symbol}</div>
                                            </div>
                                            <div className="text-right w-24">
                                                <div className="font-medium text-sm">{formatCurrency(stock.price)}</div>
                                                <div className={`text-xs mt-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {isPositive ? '+' : '-'}{changePercent}%
                                                </div>
                                            </div>
                                            <div className="text-right w-20">
                                                <button className="px-5 py-1.5 border border-primary text-primary rounded-md font-medium text-xs hover:bg-primary hover:text-primary-foreground transition-colors w-full">
                                                    Buy
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Right */}
                <div className="flex flex-col gap-6">
                    {/* Your Investments */}
                    <section>
                        <h2 className="text-xl font-semibold mb-6 text-foreground">Your investments</h2>
                        <div className="border bg-card rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1 font-medium">Current</div>
                                    <div className="text-3xl font-bold tracking-tight">{formatCurrency(portfolioData?.currentValue || 0)}</div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-5 border-t text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">1D returns</span>
                                    <span className={portfolioData?.onedayReturnAmt >= 0 ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
                                        {portfolioData?.onedayReturnAmt >= 0 ? '+' : '-'}{formatCurrency(Math.abs(portfolioData?.onedayReturnAmt))} ({Math.abs(portfolioData?.onedayReturnPct)}%)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total returns</span>
                                    <span className={portfolioData?.totalReturnAmt >= 0 ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
                                        {portfolioData?.totalReturnAmt >= 0 ? '+' : '-'}{formatCurrency(Math.abs(portfolioData?.totalReturnAmt))} ({Math.abs(portfolioData?.totalReturnPct)}%)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Invested</span>
                                    <span className="font-semibold">{formatCurrency(portfolioData?.investedAmount || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Products & Tools */}
                    <section>
                        <h2 className="text-xl font-semibold mb-6 text-foreground mt-4">Products & Tools</h2>
                        <div className="border bg-card rounded-2xl divide-y shadow-sm">
                            {[
                                { name: "IPO", icon: Megaphone, label: "3 open" },
                                { name: "Bonds", icon: Receipt, label: "3 open" },
                                { name: "ETF Screener", icon: BarChart3, label: "" },
                                { name: "Global Indices", icon: Globe, label: "" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-5 hover:bg-secondary/30 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-emerald-500/10 rounded-full">
                                            <item.icon className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <span className="font-medium text-sm">{item.name}</span>
                                    </div>
                                    {item.label && (
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                                            {item.label}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
