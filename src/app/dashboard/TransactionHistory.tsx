"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight, Loader2, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from "lucide-react";

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

interface TransactionHistoryProps {
    marketData: any[];
}

export default function TransactionHistory({ marketData }: TransactionHistoryProps) {
    const [trades, setTrades] = useState<TradeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const pageSize = 5;

    const fetchHistory = async (pageIndex: number) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/v1/trade/orders?page=${pageIndex}&size=${pageSize}`);
            setTrades(response.data.content);
            setTotalPages(response.data.totalPages);
            setPage(pageIndex);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch transaction history:", err);
            setError("Unable to load transaction history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(0);
    }, []);

    // Also refresh when a new trade is made
    useEffect(() => {
        const refreshFunc = (window as any).refreshDashboard;
        (window as any).refreshDashboard = async () => {
            if (refreshFunc) await refreshFunc();
            fetchHistory(0);
        };

        return () => {
            (window as any).refreshDashboard = refreshFunc;
        };
    }, []);

    const marketMap = new Map(marketData.map((s: any) => [s.id, s]));

    if (loading && trades.length === 0) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex justify-center items-center px-12 py-16">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mt-10">
            <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-800 tracking-tight">Recent Activity</h2>
            </div>

            {error ? (
                <div className="p-6 text-center text-sm text-red-500 bg-red-50">{error}</div>
            ) : trades.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No transactions yet.</p>
                </div>
            ) : (
                <>
                    <div className="divide-y divide-gray-50">
                        {trades.map((trade) => {
                            const isBuy = trade.tradeType.toUpperCase() === "BUY";
                            const symbol = marketMap.get(trade.stockId)?.symbol || `Stock #${trade.stockId}`;
                            const totalValue = trade.quantity * trade.price;

                            const date = new Date(trade.tradeDate);
                            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={trade.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full flex-shrink-0 ${isBuy ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {isBuy ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-[15px] text-gray-900 mb-0.5">
                                                {isBuy ? 'Bought' : 'Sold'} {symbol}
                                            </div>
                                            <div className="text-xs font-medium text-gray-500">
                                                {formattedDate} • {formattedTime}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`font-medium text-[15px] mb-0.5 ${isBuy ? 'text-gray-900' : 'text-gray-900'}`}>
                                            ₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-xs font-medium text-gray-500">
                                            {trade.quantity} @ ₹{trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <button
                                onClick={() => fetchHistory(page - 1)}
                                disabled={page === 0 || loading}
                                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:hover:text-gray-600 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            <span className="text-xs font-medium text-gray-500">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                onClick={() => fetchHistory(page + 1)}
                                disabled={page >= totalPages - 1 || loading}
                                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:hover:text-gray-600 transition-colors"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
