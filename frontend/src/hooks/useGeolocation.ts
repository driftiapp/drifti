import { useState, useEffect } from 'react';

interface GeolocationState {
    location: {
        latitude: number | null;
        longitude: number | null;
    };
    error: string | null;
}

export const useGeolocation = () => {
    const [state, setState] = useState<GeolocationState>({
        location: {
            latitude: null,
            longitude: null
        },
        error: null
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState(prev => ({
                ...prev,
                error: 'Geolocation is not supported by your browser'
            }));
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            setState({
                location: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                },
                error: null
            });
        };

        const handleError = (error: GeolocationPositionError) => {
            setState(prev => ({
                ...prev,
                error: error.message
            }));
        };

        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        // Get initial location
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            options
        );

        // Set up continuous watching
        const watchId = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            options
        );

        // Cleanup
        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    return state;
}; 