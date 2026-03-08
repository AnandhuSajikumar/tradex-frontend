"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";
import { X, Loader2 } from "lucide-react";

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    stock: { id: number; symbol: string; price: number } | null;
    initialAction: "Buy" | "Sell";
    onSuccess: () => void;
}

export default function TradeModal({ isOpen, onClose, stock, initialAction, onSuccess }: TradeModalProps) {
    const [action, setAction] = useState<"Buy" | "Sell">(initialAction);
    const [quantity, setQuantity] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !stock) return null;

    const totalValue = stock.price * quantity;

    const handleTrade = async () => {
        if (quantity <= 0) {
            setError("Quantity must be greater than 0");
            return;
        }

        setLoading(true);
        setError(null);

        const endpoint = action === "Buy" ? "/api/v1/trade/buy" : "/api/v1/trade/sell";
        const idempotencyKey = uuidv4();

        try {
            await api.post(
                endpoint,
                { stockId: stock.id, quantity },
                { headers: { "Idempotency-Key": idempotencyKey } }
            );

            // Wait slightly for balance/holdings to update in the backend systems
            setTimeout(() => {
                onSuccess();
                onClose();
                setLoading(false);
            }, 500);

        } catch (err: any) {
            console.error(`${action} failed:`, err);
            setError(err.response?.data?.message || err.response?.data || `Failed to execute ${action} order`);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
                        {action} {stock.symbol}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Action Toggle */}
                    <div className="flex bg-gray-50 p-1 rounded-xl mb-6">
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${action === "Buy"
                                    ? "bg-white text-emerald-600 shadow-sm border border-gray-200/50"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                                }`}
                            onClick={() => { setAction("Buy"); setError(null); }}
                        >
                            Buy
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${action === "Sell"
                                    ? "bg-white text-red-600 shadow-sm border border-gray-200/50"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                                }`}
                            onClick={() => { setAction("Sell"); setError(null); }}
                        >
                            Sell
                        </button>
                    </div>

                    {/* Stock Price Info */}
                    <div className="mb-6 pb-6 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-gray-500 text-sm font-medium">Market Price</span>
                        <span className="text-xl font-medium text-gray-900 tracking-tight">
                            ₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-2 mb-6">
                        <label className="text-sm font-medium text-gray-700 block">Quantity</label>
                        <div className="flex items-center">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={quantity || ""}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                className="w-full h-10 border border-gray-300 text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                            />
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Total Value */}
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-gray-500 font-medium">Total Value</span>
                        <span className="text-2xl font-medium text-gray-900 tracking-tight">
                            ₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleTrade}
                        disabled={loading || quantity <= 0}
                        className={`w-full py-3.5 rounded-xl font-medium text-white shadow-sm flex items-center justify-center gap-2 transition-colors
                            ${loading || quantity <= 0 ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}
                            ${action === "Buy" ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-red-500 shadow-red-500/20'}`
                        }
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {loading ? 'Processing...' : `Confirm ${action}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
