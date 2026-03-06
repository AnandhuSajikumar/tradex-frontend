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
                        currentValue: 8800.00,
                        investedAmount: 9007.00,
                        onedayReturnAmt: -121.00,
                        onedayReturnPct: -1.36,
                        totalReturnAmt: -206.80,
                        totalReturnPct: -2.30,
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
            <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4"></div>
                    <p className="text-gray-500 mt-2 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (val: number) => "₹" + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const mostTraded = marketData.slice(0, 4);
    const topMovers = marketData.slice(4);

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans text-gray-900 animate-in fade-in duration-500">
            {/* Index Ticker Top Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1200px] mx-auto px-6 overflow-x-auto whitespace-nowrap py-3 flex gap-8 text-[13px] font-semibold" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {["NIFTY 24,467.30 -298.60 (1.21%)", "SENSEX 78,973.65 -1,042.25 (1.30%)", "BANKNIFTY 57,777.15 -1,278.70 (2.17%)", "MIDCPNIFTY 13,174.35 -86.15 (0.65%)"].map((idx, i) => {
                        const parts = idx.split(" ");
                        return (
                            <div key={i} className="flex gap-2 items-center text-gray-500 cursor-pointer hover:text-gray-800 transition-colors">
                                <span className="uppercase tracking-wide">{parts[0]}</span>
                                <span className="text-gray-900">{parts[1]}</span>
                                <span className="text-red-500 font-medium">{parts[2]} {parts[3]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
                {/* Main Content Left */}
                <div className="flex flex-col gap-10">

                    {/* Most Traded Stocks Section */}
                    <section>
                        <h2 className="text-xl font-medium mb-5 text-gray-800 tracking-tight">Most traded stocks on TradeX</h2>
                        <div className="flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
                            {mostTraded.map((stock) => {
                                const { isPositive, changeAmount, changePercent } = getMockChange(stock.symbol, stock.price);
                                return (
                                    <div key={stock.symbol} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all cursor-pointer min-w-[210px] flex-shrink-0">
                                        <div className="h-11 w-11 rounded-full border border-gray-100 flex items-center justify-center mb-4 bg-blue-50/50 text-blue-600 font-bold shadow-sm text-sm">
                                            {stock.symbol.substring(0, 2)}
                                        </div>
                                        <h3 className="text-[15px] font-medium mb-6 text-gray-700 line-clamp-1">{stock.symbol}</h3>
                                        <div className="mt-auto">
                                            <div className="text-[17px] font-medium tracking-tight text-gray-900 mb-0.5">{formatCurrency(stock.price)}</div>
                                            <div className={`text-[13px] font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {isPositive ? '+' : '-'}{changeAmount} ({changePercent}%)
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Top Movers Today Section */}
                    <section>
                        <h2 className="text-xl font-medium mb-5 text-gray-800 tracking-tight">Top movers today</h2>

                        <div className="flex gap-3 mb-5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                            {["Gainers", "Losers", "Volume shockers", "NIFTY 100"].map((tab, i) => (
                                <button key={i} className={`px-4 py-2 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors ${i === 0 ? 'bg-white text-gray-900 border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                    {tab} {i === 3 && <span className="ml-1 text-[10px]">▼</span>}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-6 px-6 py-4 border-b border-gray-100 text-[13px] font-medium text-gray-500">
                                <div>Company</div>
                                <div className="text-right w-28">Market price (1D)</div>
                                <div className="text-right w-24">Action</div>
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                                {topMovers.map((stock) => {
                                    const { isPositive, changeAmount, changePercent } = getMockChange(stock.symbol, stock.price);
                                    return (
                                        <div key={stock.symbol} className="grid grid-cols-[1fr_auto_auto] gap-6 px-6 py-4 items-center hover:bg-gray-50 cursor-pointer transition-colors group">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="h-10 w-10 flex-shrink-0 rounded border border-gray-100 bg-orange-50/50 flex items-center justify-center text-[13px] font-bold text-orange-600 shadow-sm">
                                                    {stock.symbol.charAt(0)}
                                                </div>
                                                <div className="font-medium text-[15px] text-gray-800 truncate group-hover:text-primary transition-colors">{stock.symbol}</div>
                                            </div>
                                            <div className="text-right w-28">
                                                <div className="font-medium text-[15px] text-gray-900 tracking-tight">{formatCurrency(stock.price)}</div>
                                                <div className={`text-[13px] font-medium mt-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {isPositive ? '+' : '-'}{changeAmount} ({changePercent}%)
                                                </div>
                                            </div>
                                            <div className="text-right w-24">
                                                <button className="px-6 py-2 border border-emerald-500 text-emerald-600 rounded font-medium text-[13px] hover:bg-emerald-50 transition-colors w-full">
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
                <div className="flex flex-col gap-10">
                    {/* Your Investments */}
                    <section>
                        <h2 className="text-xl font-medium mb-5 text-gray-800 tracking-tight">Your investments</h2>
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="mb-8">
                                <div className="text-[15px] text-gray-500 mb-2 font-medium">Current</div>
                                <div className="text-3xl font-medium text-gray-900 tracking-tight">{formatCurrency(portfolioData?.currentValue || 0)}</div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100 text-[14px]">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium tracking-wide">1D returns</span>
                                    <span className={portfolioData?.onedayReturnAmt >= 0 ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
                                        {portfolioData?.onedayReturnAmt >= 0 ? '+' : '-'}{formatCurrency(Math.abs(portfolioData?.onedayReturnAmt))} ({Math.abs(portfolioData?.onedayReturnPct)}%)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium tracking-wide">Total returns</span>
                                    <span className={portfolioData?.totalReturnAmt >= 0 ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
                                        {portfolioData?.totalReturnAmt >= 0 ? '+' : '-'}{formatCurrency(Math.abs(portfolioData?.totalReturnAmt))} ({Math.abs(portfolioData?.totalReturnPct)}%)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium tracking-wide">Invested</span>
                                    <span className="text-gray-900 font-medium">{formatCurrency(portfolioData?.investedAmount || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Products & Tools */}
                    <section>
                        <h2 className="text-xl font-medium mb-5 text-gray-800 tracking-tight">Products & Tools</h2>
                        <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 shadow-sm">
                            {[
                                { name: "IPO", icon: Megaphone, label: "3 open" },
                                { name: "Bonds", icon: Receipt, label: "3 open" },
                                { name: "ETF Screener", icon: BarChart3, label: "" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg group-hover:bg-white transition-colors">
                                            <item.icon className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <span className="font-medium text-[15px] text-gray-800">{item.name}</span>
                                    </div>
                                    {item.label && (
                                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
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
