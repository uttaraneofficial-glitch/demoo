"use client"

import { useEffect, useRef, useState } from 'react'
import { ApiUser, ApiSignal } from '@/lib/apiClient'
import { MarkerClusterer } from '@googlemaps/markerclusterer'

interface NearbyMapProps {
    center: { lat: number; lng: number };
    users: ApiUser[];
    signals: ApiSignal[];
    spaces: any[];
    radius: number;
}

const darkMapStyle = [
    {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#8c8c8c" }]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [{ "visibility": "on" }, { "color": "#000000" }, { "lightness": 16 }]
    },
    {
        "featureType": "all",
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#000000" }, { "lightness": 20 }]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#000000" }, { "lightness": 17 }, { "weight": 1.2 }]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }, { "lightness": 20 }]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }, { "lightness": 21 }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#000000" }, { "lightness": 17 }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#000000" }, { "lightness": 29 }, { "weight": 0.2 }]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }, { "lightness": 18 }]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }, { "lightness": 16 }]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }, { "lightness": 19 }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }, { "lightness": 17 }]
    }
];

export default function NearbyMap({ center, users, signals, spaces, radius }: NearbyMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const markersRef = useRef<google.maps.Marker[]>([])
    const clustererRef = useRef<MarkerClusterer | null>(null)

    // 1. Load Script & Initialize Map
    useEffect(() => {
        // Wait for google.maps to be fully available (loaded by layout.tsx)
        const checkGoogleMaps = setInterval(() => {
            if (window.google && window.google.maps && window.google.maps.Map) {
                clearInterval(checkGoogleMaps)
                initMap()
            }
        }, 200)

        function initMap() {
            if (!mapRef.current || map) return
            try {
                const newMap = new google.maps.Map(mapRef.current, {
                    center,
                    zoom: 12,
                    styles: darkMapStyle,
                    disableDefaultUI: true,
                    zoomControl: true,
                })
                setMap(newMap)
            } catch (err) {
                console.error("Map initialization failed:", err)
            }
        }

        return () => clearInterval(checkGoogleMaps)
    }, [])

    // Helper to add slight random offset to prevent perfect overlap of markers
    const getJitter = () => (Math.random() - 0.5) * 0.003;

    // 2. Update Markers and Pan when data or center changes
    useEffect(() => {
        if (!map) return

        // Panning
        map.panTo(center)

        // Clear existing markers
        if (clustererRef.current) {
            clustererRef.current.clearMarkers()
        } else {
            markersRef.current.forEach(m => m.setMap(null))
        }
        markersRef.current = []

        console.log(`[NearbyMap] Rendering markers: Users=${users?.length}, Signals=${signals?.length}, Spaces=${spaces?.length}`);

        // Add User markers (Gold)
        if (Array.isArray(users)) {
            users.forEach(u => {
                if (u.lat && u.lng) {
                    const marker = new google.maps.Marker({
                        position: { lat: Number(u.lat) + getJitter(), lng: Number(u.lng) + getJitter() },
                        title: u.name,
                        label: {
                            text: '👤',
                            fontSize: '12px',
                            color: '#FFFFFF'
                        },
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#FFD700',
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: '#FFFFFF',
                            scale: 16
                        }
                    })
                    marker.addListener('click', () => {
                        window.location.href = `/profile/${u.id}`;
                    });
                    markersRef.current.push(marker)
                }
            })
        }

        // Add Signal markers (Orange)
        if (Array.isArray(signals)) {
            signals.forEach(s => {
                if (s.lat && s.lng) {
                    const marker = new google.maps.Marker({
                        position: { lat: Number(s.lat) + getJitter(), lng: Number(s.lng) + getJitter() },
                        title: s.title,
                        label: {
                            text: '📡',
                            fontSize: '10px',
                            color: '#FFFFFF'
                        },
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#FF4500',
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: '#FFFFFF',
                            scale: 16
                        }
                    })
                    marker.addListener('click', () => {
                        window.location.href = `/signals/${s.id}`;
                    });
                    markersRef.current.push(marker)
                }
            })
        }

        // Add Space markers (Green)
        if (Array.isArray(spaces)) {
            spaces.forEach(sp => {
                if (sp.lat && sp.lng) {
                    const marker = new google.maps.Marker({
                        position: { lat: Number(sp.lat) + getJitter(), lng: Number(sp.lng) + getJitter() },
                        title: sp.name,
                        label: {
                            text: '🏢',
                            fontSize: '10px',
                            color: '#FFFFFF'
                        },
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#32CD32',
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: '#FFFFFF',
                            scale: 16
                        }
                    })
                    marker.addListener('click', () => {
                        window.location.href = `/signals/${sp.id}`;
                    });
                    markersRef.current.push(marker)
                }
            })
        }

        // Add Center marker (Blue)
        const centerMarker = new google.maps.Marker({
            position: center,
            title: "Search Center",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4169E1',
                fillOpacity: 1,
                scale: 10,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
            }
        })
        markersRef.current.push(centerMarker)
        
        // Initialize or update MarkerClusterer
        if (!clustererRef.current) {
            clustererRef.current = new MarkerClusterer({ map, markers: markersRef.current })
        } else {
            clustererRef.current.addMarkers(markersRef.current)
        }
        
    }, [map, users, signals, spaces, center])

    return (
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-border relative bg-surface shadow-inner">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Legend Overlay */}
            <div className="absolute bottom-8 left-8 bg-surface/95 backdrop-blur-md border border-border p-5 rounded-2xl flex flex-col gap-4 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FFD700] border border-black/10 shadow-sm" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Ecosystem Nodes</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-sm bg-[#FF4500] border border-black/10 shadow-sm" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Active Signals</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rotate-45 bg-[#32CD32] border border-black/10 shadow-sm" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Collaboration Spaces</span>
                </div>
            </div>
        </div>
    )
}
