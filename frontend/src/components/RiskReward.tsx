import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface RiskChallenge {
    id: string;
    originalChallengeId: string;
    betAmount: number;
    potentialReward: number;
    potentialLoss: number;
    status: string;
    createdAt: string;
}

interface LootBox {
    _id: string;
    type: 'common' | 'rare' | 'epic' | 'legendary';
    contents: Array<{
        type: 'xp' | 'multiplier' | 'perk';
        amount?: number;
        id?: string;
    }>;
    status: 'unopened' | 'opened';
    createdAt: string;
}

const RiskReward: React.FC = () => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [selectedLootBox, setSelectedLootBox] = useState<LootBox | null>(null);
    const queryClient = useQueryClient();

    const { data: activeChallenges } = useQuery({
        queryKey: ['activeRiskChallenges'],
        queryFn: () => api.get<RiskChallenge[]>('/api/risk-reward/challenges/active').then(res => res.data)
    });

    const { data: lootBoxes } = useQuery({
        queryKey: ['lootBoxes'],
        queryFn: () => api.get<LootBox[]>('/api/risk-reward/lootboxes').then(res => res.data)
    });

    const createRiskChallengeMutation = useMutation({
        mutationFn: ({ challengeId, betAmount }: { challengeId: string; betAmount: number }) =>
            api.post(`/api/risk-reward/challenge/${challengeId}`, { betAmount }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeRiskChallenges'] });
        }
    });

    const completeRiskChallengeMutation = useMutation({
        mutationFn: ({ riskChallengeId, success }: { riskChallengeId: string; success: boolean }) =>
            api.post(`/api/risk-reward/challenge/${riskChallengeId}/complete`, { success }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeRiskChallenges'] });
            queryClient.invalidateQueries({ queryKey: ['lootBoxes'] });
            triggerConfetti();
        }
    });

    const openLootBoxMutation = useMutation({
        mutationFn: (lootBoxId: string) =>
            api.post(`/api/risk-reward/lootbox/${lootBoxId}/open`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lootBoxes'] });
            triggerConfetti();
        }
    });

    const triggerConfetti = () => {
        setShowConfetti(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        setTimeout(() => setShowConfetti(false), 2000);
    };

    const getLootBoxColor = (type: string) => {
        switch (type) {
            case 'legendary': return 'from-yellow-400 to-yellow-600';
            case 'epic': return 'from-purple-400 to-purple-600';
            case 'rare': return 'from-blue-400 to-blue-600';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    const getLootBoxEmoji = (type: string) => {
        switch (type) {
            case 'legendary': return '🌟';
            case 'epic': return '💫';
            case 'rare': return '⭐';
            default: return '✨';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Active Risk Challenges */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Active Risk Challenges 🎲</h2>
                {activeChallenges?.length === 0 ? (
                    <p className="text-gray-600">No active risk challenges</p>
                ) : (
                    <div className="space-y-4">
                        {activeChallenges?.map(challenge => (
                            <div
                                key={challenge.id}
                                className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">Bet Amount: {challenge.betAmount} XP</p>
                                        <p className="text-green-600">Potential Win: +{challenge.potentialReward} XP</p>
                                        <p className="text-red-600">Potential Loss: -{challenge.potentialLoss} XP</p>
                                    </div>
                                    <div className="space-x-2">
                                        <button
                                            onClick={() => completeRiskChallengeMutation.mutate({
                                                riskChallengeId: challenge.id,
                                                success: true
                                            })}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            Complete
                                        </button>
                                        <button
                                            onClick={() => completeRiskChallengeMutation.mutate({
                                                riskChallengeId: challenge.id,
                                                success: false
                                            })}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            Fail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Loot Boxes */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
            >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Loot Boxes 🎁</h2>
                {lootBoxes?.length === 0 ? (
                    <p className="text-gray-600">No loot boxes available</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lootBoxes?.map(lootBox => (
                            <motion.div
                                key={lootBox._id}
                                whileHover={{ scale: 1.05 }}
                                className={`relative rounded-lg p-4 bg-gradient-to-r ${getLootBoxColor(lootBox.type)} text-white`}
                            >
                                <div className="text-4xl mb-2">{getLootBoxEmoji(lootBox.type)}</div>
                                <p className="font-semibold capitalize">{lootBox.type} Loot Box</p>
                                {lootBox.status === 'unopened' ? (
                                    <button
                                        onClick={() => openLootBoxMutation.mutate(lootBox._id)}
                                        className="mt-4 px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100"
                                    >
                                        Open
                                    </button>
                                ) : (
                                    <div className="mt-4">
                                        <p className="font-semibold">Contents:</p>
                                        <ul className="mt-2 space-y-1">
                                            {lootBox.contents.map((item, index) => (
                                                <li key={index}>
                                                    {item.type === 'xp' && `+${item.amount} XP`}
                                                    {item.type === 'multiplier' && `${item.amount}x Multiplier`}
                                                    {item.type === 'perk' && item.id}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default RiskReward; 