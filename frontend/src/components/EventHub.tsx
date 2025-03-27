import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Event {
    _id: string;
    title: string;
    description: string;
    category: string;
    location: {
        coordinates: [number, number];
        address: string;
    };
    startTime: string;
    endTime: string;
    images: Array<{
        url: string;
        caption: string;
    }>;
    pricing: {
        basePrice: number;
        currency: string;
        discounts: Array<{
            type: string;
            amount: number;
            validUntil: string;
        }>;
    };
    perks: string[];
    viewCount: number;
    bookingCount: number;
    averageRating: number;
    nftTickets: Array<{
        tokenId: string;
        ownerId: string;
    }>;
    liveStream?: {
        isActive: boolean;
        url: string;
    };
}

const EventHub: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const queryClient = useQueryClient();

    // Fetch user's location
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, []);

    // Fetch events
    const { data: events, isLoading } = useQuery<Event[]>('events', async () => {
        const response = await axios.get('/api/events/nearby', {
            params: {
                latitude: userLocation?.[0],
                longitude: userLocation?.[1],
                radius: 50
            }
        });
        return response.data;
    }, {
        enabled: !!userLocation
    });

    // Fetch trending events
    const { data: trendingEvents } = useQuery<Event[]>('trendingEvents', async () => {
        const response = await axios.get('/api/events/trending');
        return response.data;
    });

    // Update view count mutation
    const updateViewMutation = useMutation(
        async (eventId: string) => {
            await axios.post(`/api/events/${eventId}/view`);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('events');
            }
        }
    );

    // Filter events by category
    const filteredEvents = events?.filter(event => 
        selectedCategory === 'all' || event.category === selectedCategory
    );

    // Handle event selection
    const handleEventSelect = (event: Event) => {
        setSelectedEvent(event);
        updateViewMutation.mutate(event._id);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6"
            >
                <h1 className="text-4xl font-bold mb-2">Drifti Live & Local</h1>
                <p className="text-xl opacity-90">Discover amazing events near you</p>
            </motion.header>

            {/* Category Filter */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white shadow-md p-4"
            >
                <div className="flex space-x-4 overflow-x-auto pb-2">
                    {['all', 'Nightlife', 'Dining', 'Festivals', 'Cruise', 'Theme Parks', 'Concerts', 'Sports', 'Arts'].map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap ${
                                selectedCategory === category
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Event List */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : (
                        filteredEvents?.map(event => (
                            <motion.div
                                key={event._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                                onClick={() => handleEventSelect(event)}
                            >
                                <div className="relative h-48">
                                    <img
                                        src={event.images[0]?.url || '/placeholder.jpg'}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {event.liveStream?.isActive && (
                                        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-sm">
                                            LIVE
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                                    <p className="text-gray-600 mb-2">{event.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-purple-600 font-semibold">
                                            ${event.pricing.basePrice}
                                        </span>
                                        <div className="flex items-center">
                                            <span className="text-yellow-500 mr-1">★</span>
                                            <span>{event.averageRating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Map */}
                <div className="lg:col-span-1 h-[600px] rounded-lg overflow-hidden shadow-md">
                    {userLocation && (
                        <MapContainer
                            center={userLocation}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {filteredEvents?.map(event => (
                                <Marker
                                    key={event._id}
                                    position={event.location.coordinates}
                                    onClick={() => handleEventSelect(event)}
                                >
                                    <Popup>
                                        <div>
                                            <h3 className="font-semibold">{event.title}</h3>
                                            <p className="text-sm">{event.location.address}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                </div>
            </div>

            {/* Event Details Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedEvent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="relative">
                                <img
                                    src={selectedEvent.images[0]?.url || '/placeholder.jpg'}
                                    alt={selectedEvent.title}
                                    className="w-full h-64 object-cover rounded-t-lg"
                                />
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="p-6">
                                <h2 className="text-3xl font-bold mb-4">{selectedEvent.title}</h2>
                                <p className="text-gray-600 mb-4">{selectedEvent.description}</p>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <h3 className="font-semibold mb-2">Location</h3>
                                        <p>{selectedEvent.location.address}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Date & Time</h3>
                                        <p>
                                            {new Date(selectedEvent.startTime).toLocaleDateString()}
                                            <br />
                                            {new Date(selectedEvent.startTime).toLocaleTimeString()} - 
                                            {new Date(selectedEvent.endTime).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="font-semibold mb-2">Perks</h3>
                                    <ul className="grid grid-cols-2 gap-2">
                                        {selectedEvent.perks.map((perk, index) => (
                                            <li key={index} className="flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                {perk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-2xl font-bold text-purple-600">
                                            ${selectedEvent.pricing.basePrice}
                                        </span>
                                        <span className="text-gray-600 ml-2">per person</span>
                                    </div>
                                    <button className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors">
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventHub; 