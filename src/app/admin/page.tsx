"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight, Loader2, ArrowUpRight, ArrowDownRight, ShieldCheck } from "lucide-react";

interface TradeResponse {
    id: number;
    stockId: number;
    userId: number;
    quantity: number;
    price: number;
    tradeType: string;
    tradeDate: string;
    remainingWalletBalance: number;
}

export default function AdminDashboardPage() {
    const [trades, setTrades] = useState<TradeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalTrades, setTotalTrades] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // To properly display stock symbols instead of IDs
    const [marketData, setMarketData] = useState<any[]>([]);

    const pageSize = 10;

    const fetchAdminData = async (pageIndex: number) => {
        setLoading(true);
        try {
            // Concurrently fetch market data (if not cached) and the global trades page
            const [marketRes, tradeRes] = await Promise.all([
                api.get('/v1/api/market/all'),
                api.get(`/api/v1/trade/admin/all-trades?page=${pageIndex}&size=${pageSize}`)
            ]);

            setMarketData(marketRes.data);
            setTrades(tradeRes.data.content);
            setTotalPages(tradeRes.data.totalPages);
            setTotalTrades(tradeRes.data.totalElements);
            setPage(pageIndex);
            setError(null);
        } catch (err: any) {
            console.error("Failed to fetch admin data:", err);
            setError(err.response?.data?.message || "Failed to load global trades.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData(0);
    }, []);

    const marketMap = new Map(marketData.map((s: any) => [s.id, s]));

    if (loading && trades.length === 0) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-indigo-500" />
                            Admin Console
                        </h1>
                        <p className="text-gray-500 mt-1">Platform-wide Global Order Ledger</p>
                    </div>

                    <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">Total Lifetime Executions</span>
                        <span className="text-lg font-semibold text-gray-900 border-l border-gray-100 pl-3">
                            {totalTrades.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Global Trades Data Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    {error ? (
                        <div className="p-12 text-center text-red-500 font-medium bg-red-50/50">{error}</div>
                    ) : trades.length === 0 ? (
                        <div className="p-16 text-center text-gray-500 font-medium">No trades have been executed on the platform.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Transaction ID</th>
                                        <th className="px-6 py-4">User ID</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Asset</th>
                                        <th className="px-6 py-4 text-right">Quantity</th>
                                        <th className="px-6 py-4 text-right">Exec Price</th>
                                        <th className="px-6 py-4 text-right">Total Value</th>
                                        <th className="px-6 py-4 text-right">Date/Time (Local)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {trades.map((trade) => {
                                        const isBuy = trade.tradeType.toUpperCase() === "BUY";
                                        const symbol = marketMap.get(trade.stockId)?.symbol || `ID:${trade.stockId}`;
                                        const totalValue = trade.quantity * trade.price;

                                        const date = new Date(trade.tradeDate);
                                        const formattedDate = date.toLocaleDateString();
                                        const formattedTime = date.toLocaleTimeString();

                                        return (
                                            <tr key={trade.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">#TRD-{trade.id.toString().padStart(6, '0')}</td>
                                                <td className="px-6 py-4 font-medium text-indigo-600">USR-{trade.userId}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${isBuy ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                        {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {trade.tradeType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{symbol}</td>
                                                <td className="px-6 py-4 text-right">{trade.quantity.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">₹{trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-900">₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                                    {formattedDate} • {formattedTime}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {totalPages > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 mt-auto">
                            <button
                                onClick={() => fetchAdminData(page - 1)}
                                disabled={page === 0 || loading}
                                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>

                            <span className="text-sm font-medium text-gray-500">
                                Page <span className="text-gray-900">{page + 1}</span> of <span className="text-gray-900">{totalPages}</span>
                            </span>

                            <button
                                onClick={() => fetchAdminData(page + 1)}
                                disabled={page >= totalPages - 1 || loading}
                                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
