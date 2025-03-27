import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { loadStripe } from '@stripe/stripe-js';
import { MotionWrapper } from './MotionWrapper';

interface NFTTicket {
    tokenId: string;
    type: 'VIP' | 'Standard' | 'Early Bird';
    benefits: string[];
    price: number;
    metadata: {
        name: string;
        description: string;
        image: string;
    };
}

interface LiveStream {
    playbackUrl: string;
    streamKey: string;
    status: 'active' | 'ended' | 'pending';
    viewerCount: number;
}

interface EventNFTProps {
    eventId: string;
    isOwner: boolean;
}

interface PaymentIntent {
    clientSecret: string;
}

const EventNFT: React.FC<EventNFTProps> = ({ eventId, isOwner }) => {
    const [selectedTicketType, setSelectedTicketType] = useState<'VIP' | 'Standard' | 'Early Bird'>('Standard');
    const [isStreaming, setIsStreaming] = useState(false);
    const { account } = useWeb3React();

    const { data: nftTickets, isLoading: isLoadingTickets } = useQuery<NFTTicket[]>({
        queryKey: ['nftTickets', eventId],
        queryFn: async () => {
            const response = await axios.get(`/api/events/${eventId}/nft-tickets`);
            return response.data;
        }
    });

    const { data: liveStream, isLoading: isLoadingStream } = useQuery<LiveStream>({
        queryKey: ['liveStream', eventId],
        queryFn: async () => {
            const response = await axios.get(`/api/events/${eventId}/live-stream/status`);
            return response.data;
        },
        refetchInterval: 5000
    });

    const createNFTTicketMutation = useMutation<PaymentIntent, Error, string>({
        mutationFn: async (ticketType) => {
            const response = await axios.post(`/api/events/${eventId}/nft-ticket`, {
                ticketType
            });
            return response.data;
        }
    });

    const startLiveStreamMutation = useMutation<void, Error, void>({
        mutationFn: async () => {
            await axios.post(`/api/events/${eventId}/live-stream`);
        }
    });

    const endLiveStreamMutation = useMutation<void, Error, void>({
        mutationFn: async () => {
            await axios.post(`/api/events/${eventId}/live-stream/end`);
        }
    });

    const handlePurchaseNFT = async () => {
        if (!account) {
            // Handle wallet connection through your app's wallet connection flow
            console.log('Please connect your wallet first');
            return;
        }

        try {
            const result = await createNFTTicketMutation.mutateAsync(selectedTicketType);
            
            if (result.clientSecret) {
                const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');
                if (stripe) {
                    const { error } = await stripe.confirmCardPayment(result.clientSecret);
                    if (error) {
                        console.error('Payment failed:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error purchasing NFT:', error);
        }
    };

    const handleStartStream = async () => {
        try {
            await startLiveStreamMutation.mutateAsync();
            setIsStreaming(true);
        } catch (error) {
            console.error('Error starting stream:', error);
        }
    };

    const handleEndStream = async () => {
        try {
            await endLiveStreamMutation.mutateAsync();
            setIsStreaming(false);
        } catch (error) {
            console.error('Error ending stream:', error);
        }
    };

    if (isLoadingTickets || isLoadingStream) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* NFT Tickets Section */}
            <MotionWrapper
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg p-6"
            >
                <h2 className="text-2xl font-bold mb-4">NFT Tickets</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {nftTickets?.map((ticket) => (
                        <MotionWrapper
                            key={ticket.tokenId}
                            whileHover={{ scale: 1.05 }}
                            className={`border rounded-lg p-4 ${
                                selectedTicketType === ticket.type
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200'
                            }`}
                        >
                            <h3 className="text-xl font-semibold">{ticket.type}</h3>
                            <p className="text-gray-600">${ticket.price}</p>
                            <ul className="mt-2 space-y-1">
                                {ticket.benefits.map((benefit, index) => (
                                    <li key={index} className="text-sm text-gray-500">
                                        • {benefit}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => setSelectedTicketType(ticket.type)}
                                className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                            >
                                Select
                            </button>
                        </MotionWrapper>
                    ))}
                </div>
                <button
                    onClick={handlePurchaseNFT}
                    className="mt-6 w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
                >
                    Purchase NFT Ticket
                </button>
            </MotionWrapper>

            {/* Live Streaming Section */}
            {isOwner && (
                <MotionWrapper
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-lg p-6"
                >
                    <h2 className="text-2xl font-bold mb-4">Live Streaming</h2>
                    {!isStreaming ? (
                        <button
                            onClick={handleStartStream}
                            className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600"
                        >
                            Start Live Stream
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-gray-100 p-4 rounded">
                                <p className="font-semibold">Stream Key:</p>
                                <p className="font-mono text-sm">{liveStream?.streamKey}</p>
                            </div>
                            <div className="bg-gray-100 p-4 rounded">
                                <p className="font-semibold">Viewer Count:</p>
                                <p className="text-2xl">{liveStream?.viewerCount}</p>
                            </div>
                            <button
                                onClick={handleEndStream}
                                className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600"
                            >
                                End Stream
                            </button>
                        </div>
                    )}
                </MotionWrapper>
            )}

            {/* Live Stream Viewer */}
            {liveStream?.status === 'active' && (
                <MotionWrapper
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-lg p-6"
                >
                    <h2 className="text-2xl font-bold mb-4">Live Stream</h2>
                    <div className="aspect-w-16 aspect-h-9">
                        <iframe
                            src={liveStream.playbackUrl}
                            className="w-full h-full rounded-lg"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-gray-600">
                            {liveStream.viewerCount} viewers watching
                        </p>
                    </div>
                </MotionWrapper>
            )}
        </div>
    );
};

export default EventNFT; 