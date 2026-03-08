"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import TradeModal from "../dashboard/TradeModal";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16'];

export default function PortfolioPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    const [holdings, setHoldings] = useState<any[]>([]);
    const [marketData, setMarketData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Trade Modal State
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [selectedTradeStock, setSelectedTradeStock] = useState<any>(null);
    const [initialTradeAction, setInitialTradeAction] = useState<"Buy" | "Sell">("Buy");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [marketRes, holdingsRes] = await Promise.all([
                api.get('/v1/api/market/all'),
                api.get('/portfolio/holdings')
            ]);
            setMarketData(marketRes.data);
            setHoldings(holdingsRes.data);
        } catch (error) {
            console.error("Failed to fetch portfolio data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchData();
        (window as any).refreshDashboard = fetchData;
    }, [isAuthenticated, router]);

    const openTradeModal = (stock: any, action: "Buy" | "Sell") => {
        setSelectedTradeStock(stock);
        setInitialTradeAction(action);
        setIsTradeModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    // Process data for rendering
    const marketMap = new Map(marketData.map(s => [s.id, s]));

    let totalInvested = 0;
    let totalCurrent = 0;

    const enrichedHoldings = holdings.map(holding => {
        const stock = marketMap.get(holding.stockId) || { symbol: `ID:${holding.stockId}`, price: 0 };
        const invested = holding.quantity * holding.avgBuyPrice;
        const current = holding.quantity * stock.price;
        const returnAmt = current - invested;
        const returnPct = invested > 0 ? (returnAmt / invested) * 100 : 0;

        totalInvested += invested;
        totalCurrent += current;

        return {
            ...holding,
            symbol: stock.symbol,
            currentPrice: stock.price,
            invested,
            current,
            returnAmt,
            returnPct,
            stockRef: stock
        };
    });

    const totalReturnAmt = totalCurrent - totalInvested;
    const totalReturnPct = totalInvested > 0 ? (totalReturnAmt / totalInvested) * 100 : 0;

    // Prepare data for Pie Chart
    const pieData = enrichedHoldings
        .filter(h => h.current > 0)
        .map(h => ({ name: h.symbol, value: h.current }))
        .sort((a, b) => b.value - a.value);

    return (
        <div className="flex-1 p-8 bg-gray-50/30 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-emerald-500" />
                        Portfolio Analytics
                    </h1>
                    <p className="text-gray-500 mt-1">Analyze your asset allocation and individual stock performance.</p>
                </div>

                {/* Top Stats & Chart Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Summary Cards */}
                    <div className="col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="text-sm font-medium text-gray-500 mb-1">Current Value</div>
                            <div className="text-3xl font-semibold text-gray-900 tracking-tight">
                                ₹{totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Returns</div>
                            <div className={`text-2xl font-semibold tracking-tight flex items-center gap-2 ${totalReturnAmt >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {totalReturnAmt >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                ₹{Math.abs(totalReturnAmt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-sm font-medium opacity-80 bg-current/10 px-2 py-0.5 rounded ml-1">
                                    {totalReturnAmt >= 0 ? '+' : '-'}{Math.abs(totalReturnPct).toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Invested</div>
                            <div className="text-xl font-medium text-gray-700 tracking-tight">
                                ₹{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Allocation Chart */}
                    <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <h3 className="text-base font-medium text-gray-900 mb-4">Asset Allocation</h3>
                        <div className="flex-1 min-h-[300px]">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 font-medium">
                                    No assets in portfolio
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Holdings Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900">Your Holdings</h3>
                    </div>
                    {enrichedHoldings.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">Your portfolio is currently empty.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Symbol</th>
                                        <th className="px-6 py-4 text-right">Quantity</th>
                                        <th className="px-6 py-4 text-right">Avg Price</th>
                                        <th className="px-6 py-4 text-right">LTP</th>
                                        <th className="px-6 py-4 text-right">Invested</th>
                                        <th className="px-6 py-4 text-right">Current Value</th>
                                        <th className="px-6 py-4 text-right">Returns</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {enrichedHoldings.filter(h => h.quantity > 0).map((item) => {
                                        const isPositive = item.returnAmt >= 0;
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.symbol}</td>
                                                <td className="px-6 py-4 text-right">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right font-medium">₹{item.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-900">₹{item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right">₹{item.invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-900">₹{item.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {isPositive ? '+' : '-'}₹{Math.abs(item.returnAmt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        <span className="text-xs ml-1 opacity-80">({Math.abs(item.returnPct).toFixed(2)}%)</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openTradeModal(item.stockRef, "Buy")}
                                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-medium transition-colors"
                                                        >
                                                            Buy
                                                        </button>
                                                        <button
                                                            onClick={() => openTradeModal(item.stockRef, "Sell")}
                                                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                                                        >
                                                            Sell
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <TradeModal
                isOpen={isTradeModalOpen}
                onClose={() => setIsTradeModalOpen(false)}
                stock={selectedTradeStock}
                initialAction={initialTradeAction}
                onSuccess={() => fetchData()}
            />
        </div>
    );
}
