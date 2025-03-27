import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface Challenge {
    id: string;
    type: string;
    title: string;
    description: string;
    requirements: {
        deliveries: number;
        timeLimit: number;
    };
    rewards: {
        points: number;
        multiplier: number;
        perks: string[];
    };
    duration: number;
    difficulty: number;
    specialConditions: string[];
}

interface ChallengeProgress {
    completed: boolean;
    progress: number;
    remaining: number;
}

const AIChallenges: React.FC = () => {
    const [showConfetti, setShowConfetti] = useState(false);
    const queryClient = useQueryClient();

    const { data: currentChallenge, isLoading: challengeLoading } = useQuery<Challenge>(
        ['currentChallenge'],
        () => api.get('/api/challenges/current').then(res => res.data)
    );

    const { data: progress, isLoading: progressLoading } = useQuery<ChallengeProgress>(
        ['challengeProgress', currentChallenge?.id],
        () => api.get(`/api/challenges/progress/${currentChallenge?.id}`).then(res => res.data),
        { enabled: !!currentChallenge?.id }
    );

    const generateChallengeMutation = useMutation(
        () => api.post('/api/challenges/generate'),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['currentChallenge']);
                queryClient.invalidateQueries(['challengeProgress']);
            }
        }
    );

    useEffect(() => {
        if (progress?.completed) {
            triggerConfetti();
        }
    }, [progress?.completed]);

    const triggerConfetti = () => {
        setShowConfetti(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        setTimeout(() => setShowConfetti(false), 2000);
    };

    const getProgressPercentage = () => {
        if (!progress || !currentChallenge) return 0;
        return (progress.progress / currentChallenge.requirements.deliveries) * 100;
    };

    const getDifficultyEmoji = (difficulty: number) => {
        switch (difficulty) {
            case 1: return '🌱';
            case 2: return '⭐';
            case 3: return '🌟';
            case 4: return '💫';
            case 5: return '🌠';
            default: return '⭐';
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

            {/* Challenge Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">AI Challenge</h2>
                        <p className="text-gray-600">
                            {currentChallenge ? currentChallenge.title : 'No active challenge'}
                        </p>
                    </div>
                    <button
                        onClick={() => generateChallengeMutation.mutate()}
                        disabled={!!currentChallenge}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate New Challenge
                    </button>
                </div>

                {currentChallenge && (
                    <>
                        <p className="text-gray-700 mb-4">{currentChallenge.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getProgressPercentage()}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                {progress?.progress || 0} / {currentChallenge.requirements.deliveries} completed
                            </p>
                        </div>

                        {/* Challenge Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Difficulty</p>
                                <p className="text-xl font-semibold">
                                    {getDifficultyEmoji(currentChallenge.difficulty)}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Time Limit</p>
                                <p className="text-xl font-semibold">
                                    {currentChallenge.duration} hours
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Rewards</p>
                                <p className="text-xl font-semibold text-blue-600">
                                    {currentChallenge.rewards.points} XP
                                    {currentChallenge.rewards.multiplier > 1 && 
                                        ` × ${currentChallenge.rewards.multiplier}`}
                                </p>
                            </div>
                        </div>

                        {/* Special Conditions */}
                        {currentChallenge.specialConditions.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                    Special Conditions:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {currentChallenge.specialConditions.map((condition, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                                        >
                                            {condition}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default AIChallenges; 