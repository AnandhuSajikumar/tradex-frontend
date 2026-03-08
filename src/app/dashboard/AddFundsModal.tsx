"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { X, Loader2, Wallet } from "lucide-react";

interface AddFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentBalance: number;
    onSuccess: () => void;
}

export default function AddFundsModal({ isOpen, onClose, currentBalance, onSuccess }: AddFundsModalProps) {
    const [amount, setAmount] = useState<number>(1000);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const PRESET_AMOUNTS = [1000, 5000, 10000, 25000];

    if (!isOpen) return null;

    const handleAddFunds = async () => {
        if (amount <= 0) {
            setError("Amount must be greater than 0");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post("/api/v1/user/funds", { amount });

            // Wait slightly for backend to commit transaction
            setTimeout(() => {
                onSuccess();
                onClose();
                setLoading(false);
                setAmount(1000); // Reset for next time
            }, 300);

        } catch (err: any) {
            console.error("Failed to add funds:", err);
            setError(err.response?.data?.message || err.response?.data || "Failed to process deposit");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-500" />
                        Add Funds
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Current Balance */}
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                        <span className="text-gray-500 text-sm font-medium">Available Balance</span>
                        <span className="text-lg font-medium text-gray-900">
                            ₹{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Deposit Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={amount || ""}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full h-14 pl-8 pr-4 border border-gray-300 rounded-xl text-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-gray-900"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex gap-2">
                            {PRESET_AMOUNTS.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setAmount(preset)}
                                    className={`flex-1 py-1.5 text-sm font-medium border rounded-lg transition-colors ${amount === preset
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    +₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleAddFunds}
                        disabled={loading || amount <= 0}
                        className={`w-full py-4 rounded-xl font-medium text-white shadow-sm flex items-center justify-center gap-2 transition-colors
                            ${loading || amount <= 0 ? 'opacity-70 cursor-not-allowed bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`
                        }
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {loading ? 'Processing...' : `Deposit ₹${amount.toLocaleString()}`}
                    </button>

                    <p className="text-center text-xs text-gray-500 mt-4">
                        For demo purposes, this immediately credits your wallet.
                    </p>
                </div>
            </div>
        </div>
    );
}
