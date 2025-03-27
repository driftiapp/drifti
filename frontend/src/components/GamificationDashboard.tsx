import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface UserStats {
    score: number;
    level: number;
    streak: number;
    rank: number;
    activePerks: Array<{
        type: string;
        duration?: string;
        value?: string;
    }>;
    recentActivity: Array<{
        type: string;
        points: number;
        timestamp: string;
        metadata?: any;
    }>;
}

interface LeaderboardEntry {
    rank: number;
    username: string;
    score: number;
    level: number;
    avatar: string;
}

interface Perk {
    type: string;
    duration?: string;
    value?: string;
}

const GamificationDashboard: React.FC = () => {
    const [showConfetti, setShowConfetti] = useState(false);
    const { data: stats, isLoading: statsLoading } = useQuery<UserStats>(
        ['userStats'],
        () => api.get('/api/gamification/stats').then(res => res.data)
    );
    const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>(
        ['leaderboard'],
        () => api.get('/api/gamification/leaderboard').then(res => res.data)
    );

    useEffect(() => {
        if (stats?.level && stats.level > 1) {
            triggerConfetti();
        }
    }, [stats?.level]);

    const triggerConfetti = () => {
        setShowConfetti(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        setTimeout(() => setShowConfetti(false), 2000);
    };

    const getLevelProgress = () => {
        if (!stats) return 0;
        const currentLevelScore = (stats.level - 1) * 1000;
        const nextLevelScore = stats.level * 1000;
        return ((stats.score - currentLevelScore) / (nextLevelScore - currentLevelScore)) * 100;
    };

    const getStreakEmoji = (streak: number) => {
        if (streak >= 7) return '🔥';
        if (streak >= 5) return '⚡';
        if (streak >= 3) return '✨';
        return '⭐';
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

            {/* User Stats Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Your Progress</h2>
                        <p className="text-gray-600">Level {stats?.level || 1}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">{stats?.score || 0}</p>
                        <p className="text-gray-600">Total Points</p>
                    </div>
                </div>

                {/* Level Progress Bar */}
                <div className="mt-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getLevelProgress()}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        {Math.round(getLevelProgress())}% to next level
                    </p>
                </div>

                {/* Streak */}
                <div className="mt-4 flex items-center">
                    <span className="text-2xl mr-2">{getStreakEmoji(stats?.streak || 0)}</span>
                    <p className="text-lg font-semibold">
                        {stats?.streak || 0} Day Streak
                    </p>
                </div>
            </motion.div>

            {/* Active Perks */}
            {stats?.activePerks && stats.activePerks.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl shadow-lg p-6 mb-6"
                >
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Active Perks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.activePerks.map((perk: Perk, index: number) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg"
                            >
                                <p className="font-semibold text-purple-800">
                                    {perk.type === 'vip_access' ? 'VIP Access' : 'Exclusive Discount'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {perk.duration || perk.value}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Leaderboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-lg p-6"
            >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Global Leaderboard</h3>
                <div className="space-y-4">
                    {leaderboard?.map((entry, index) => (
                        <motion.div
                            key={entry.rank}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center p-4 bg-gray-50 rounded-lg"
                        >
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full">
                                <span className="font-bold text-blue-600">{entry.rank}</span>
                            </div>
                            <img
                                src={entry.avatar}
                                alt={entry.username}
                                className="w-10 h-10 rounded-full mx-4"
                            />
                            <div className="flex-1">
                                <p className="font-semibold">{entry.username}</p>
                                <p className="text-sm text-gray-600">Level {entry.level}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-blue-600">{entry.score}</p>
                                <p className="text-sm text-gray-600">points</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default GamificationDashboard; 