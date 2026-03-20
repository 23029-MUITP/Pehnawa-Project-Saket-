import React, { useState, useEffect, ReactNode } from 'react';

// Radius in meters
// @ts-ignore
const ALLOWED_RADIUS = Number(import.meta.env.VITE_ALLOWED_RADIUS_METERS || 100);
// @ts-ignore
const STORE_LAT = Number(import.meta.env.VITE_STORE_LAT || 0);
// @ts-ignore
const STORE_LNG = Number(import.meta.env.VITE_STORE_LNG || 0);

// Haversine formula to calculate distance in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth's radius in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

interface GeoLockProps {
    children: ReactNode;
}

export const GeoLock: React.FC<GeoLockProps> = ({ children }) => {
    const [status, setStatus] = useState<'loading' | 'allowed' | 'denied' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [distance, setDistance] = useState<number | null>(null);

    useEffect(() => {
        if (!STORE_LAT || !STORE_LNG) {
            setStatus('error');
            setErrorMessage('Store coordinates not configured. Please add VITE_STORE_LAT and VITE_STORE_LNG to .env.local');
            return;
        }

        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMessage('Geolocation is not supported by your browser.');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                const dist = getDistanceFromLatLonInM(STORE_LAT, STORE_LNG, userLat, userLng);
                setDistance(dist);

                if (dist <= ALLOWED_RADIUS) {
                    setStatus('allowed');
                } else {
                    setStatus('denied');
                }
            },
            (error) => {
                setStatus('error');
                if (error.code === error.PERMISSION_DENIED) {
                    setErrorMessage('Please allow location access to use this app.');
                } else {
                    setErrorMessage('Error determining your location.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    if (status === 'allowed') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-ethnic-bg text-black flex flex-col items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-ethnic-border">
                <h2 className="font-serif text-2xl font-bold text-ethnic-accent mb-4">Store Location Required</h2>

                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin w-8 h-8 border-4 border-ethnic-accent border-t-transparent rounded-full"></div>
                        <p className="text-stone-600 font-medium">Checking your location...</p>
                        <p className="text-sm text-stone-500 mt-2">Please click <b>"Allow"</b> when your browser asks for location permissions.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-red-500 font-medium">{errorMessage}</p>
                    </div>
                )}

                {status === 'denied' && (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-red-500 font-medium">You must be at the store to use this app.</p>
                        {distance !== null && (
                            <p className="text-stone-500 text-sm">
                                You are currently {Math.round(distance)} meters away. Must be within {ALLOWED_RADIUS} meters.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
