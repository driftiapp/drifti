import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface Challenge {
    id: string;
    title: string;
    description: string;
    points: number;
    completed: boolean;
    conditions?: ChallengeCondition[];
}

interface ChallengeCondition {
    type: string;
    value: number;
    current: number;
}

interface ApiResponse<T> {
    data: T;
}

const AIChallenges: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: currentChallenge, isLoading: challengeLoading } = useQuery<ApiResponse<Challenge>>({
        queryKey: ['currentChallenge'],
        queryFn: () => api.get('/api/challenges/current')
    });

    const { mutate: completeChallenge } = useMutation({
        mutationFn: (challengeId: string) => api.post(`/api/challenges/${challengeId}/complete`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentChallenge'] });
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    });

    const renderChallengeProgress = (condition: ChallengeCondition, index: number): JSX.Element => {
        const progress = (condition.current / condition.value) * 100;
        return (
            <div key={index} className="mb-4">
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                        {condition.type}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                        {condition.current}/{condition.value}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <motion.div
                        className="bg-blue-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
        );
    };

    if (challengeLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <AnimatePresence>
            {currentChallenge && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto"
                >
                    <h2 className="text-2xl font-bold mb-4">{currentChallenge.data.title}</h2>
                    <p className="text-gray-600 mb-6">{currentChallenge.data.description}</p>

                    {currentChallenge.data.conditions?.map((condition: ChallengeCondition, index: number) =>
                        renderChallengeProgress(condition, index)
                    )}

                    <div className="flex justify-between items-center mt-6">
                        <div>
                            <span className="text-sm font-medium text-gray-500">Points</span>
                            <p className="text-2xl font-bold text-blue-600">{currentChallenge.data.points}</p>
                        </div>
                        <button
                            onClick={() => completeChallenge(currentChallenge.data.id)}
                            disabled={!currentChallenge.data.completed}
                            className={`px-6 py-2 rounded-full font-medium ${
                                currentChallenge.data.completed
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {currentChallenge.data.completed ? 'Claim Reward' : 'In Progress'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AIChallenges; 