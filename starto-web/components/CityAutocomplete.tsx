"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signalsApi } from "@/lib/apiClient";

interface CityAutocompleteProps {
    value?: string;
    onChange: (city: string, lat?: number, lng?: number, fullAddress?: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    useBackendData?: boolean;
}

export default function CityAutocomplete({ 
    value = "", 
    onChange, 
    placeholder = "Search city...", 
    className = "",
    inputClassName = "",
    useBackendData = false
}: CityAutocompleteProps) {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [backendCities, setBackendCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const autocompleteService = useRef<any>(null);
    const placesService = useRef<any>(null);
    const sessionToken = useRef<any>(null);
    const isSelecting = useRef(false);
    const ignoreValueUpdate = useRef(false);
    const [isApiReady, setIsApiReady] = useState(false);

    useEffect(() => {
        if (ignoreValueUpdate.current) {
            ignoreValueUpdate.current = false;
            return;
        }
        setQuery(value);
    }, [value]);

    useEffect(() => {
        if (useBackendData) {
            signalsApi.getCities().then(({ data }) => {
                if (data) setBackendCities(data);
            });
        }
    }, [useBackendData]);

    useEffect(() => {
        const checkApi = () => {
            if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
                setIsApiReady(true);
                return true;
            }
            return false;
        };

        if (!checkApi()) {
            const timer = setInterval(() => {
                if (checkApi()) clearInterval(timer);
            }, 500);
            return () => clearInterval(timer);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = (input: string) => {
        if (!input) {
            setSuggestions([]);
            return;
        }

        setLoading(true);

        // Fetch Google Suggestions
        let googlePredictions: any[] = [];
        if (isApiReady) {
            if (!autocompleteService.current) {
                autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
                sessionToken.current = new (window as any).google.maps.places.AutocompleteSessionToken();
            }

            console.log('[CityAutocomplete] Fetching Google predictions for:', input);
            autocompleteService.current.getPlacePredictions(
                {
                    input,
                    sessionToken: sessionToken.current,
                },
                (predictions: any[] | null, status: any) => {
                    console.log('[CityAutocomplete] Google predictions status:', status);
                    if (status !== 'OK') {
                        console.error('[CityAutocomplete] Google predictions failed:', status);
                    }
                    googlePredictions = (predictions || []).map(p => ({ ...p, isBackend: false }));
                    combineSuggestions(googlePredictions);
                }
            );
        } else {
            
            combineSuggestions([]);
        }

        function combineSuggestions(gPreds: any[]) {
            const bFiltered = backendCities
                .filter(c => c.toLowerCase().includes(input.toLowerCase()))
                .map(c => ({
                    description: c,
                    place_id: `backend-${c}`,
                    isBackend: true,
                    structured_formatting: {
                        main_text: c,
                        secondary_text: "Ecosystem Data"
                    }
                }));

            setSuggestions([...bFiltered, ...gPreds]);
            setLoading(false);
            setIsOpen(true);
        }
    };

    const handleSelect = (item: any) => {
        isSelecting.current = true;
        ignoreValueUpdate.current = true;
        const cityName = item.isPhoton ? (item.properties.city || item.properties.name) : item.description;
        setQuery(item.isPhoton ? item.description : cityName);
        setIsOpen(false);

        if (item.isPhoton) {
            const [lng, lat] = item.geometry.coordinates;
            onChange(cityName, lat, lng, item.description);
            return;
        }

        if (item.isBackend) {
            onChange(cityName);
            return;
        }

        if (isApiReady) {
            if (!placesService.current) {
                const element = document.createElement('div');
                placesService.current = new (window as any).google.maps.places.PlacesService(element);
            }

            placesService.current.getDetails(
                { placeId: item.place_id, fields: ['geometry', 'formatted_address', 'address_components'] },
                (place: any, status: string) => {
                    if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        
                        let actualCity = cityName;
                        if (place.address_components) {
                            const cityComp = place.address_components.find((c: any) => c.types.includes('locality') || c.types.includes('administrative_area_level_2') || c.types.includes('administrative_area_level_1'));
                            if (cityComp) {
                                actualCity = cityComp.long_name;
                            }
                        }

                        onChange(actualCity, lat, lng, place.formatted_address || cityName);
                    } else {
                        onChange(cityName);
                    }
                }
            );
        } else {
            onChange(cityName);
        }
    };

    useEffect(() => {
        if (!query) {
            setSuggestions([]);
            return;
        }
        if (isSelecting.current) {
            isSelecting.current = false;
            return;
        }
        const timer = setTimeout(() => fetchSuggestions(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        isSelecting.current = false;
        const val = e.target.value;
        setQuery(val);
        // Also inform the parent component of the raw text so it doesn't get lost if they don't select a suggestion
        onChange(val);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${loading ? 'text-primary animate-pulse' : 'text-text-muted'}`} />
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border border-border outline-none focus:border-black text-sm shadow-sm transition-all ${inputClassName || 'bg-surface text-text-primary'}`}
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && suggestions.length > 0 && (
                    <div className="absolute z-[100] mt-2 w-full bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                        {suggestions.map((item) => (
                            <button
                                key={item.place_id}
                                onMouseDown={() => handleSelect(item)}
                                className="w-full text-left px-4 py-3 hover:bg-surface-2 flex items-start gap-3 transition-colors border-b border-border/50 last:border-0"
                            >
                                {item.isBackend ? (
                                    <Database className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                                ) : (
                                    <MapPin className="w-4 h-4 mt-0.5 text-text-muted shrink-0" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-text-primary">{item.isBackend ? item.structured_formatting.main_text : item.description}</p>
                                    <p className="text-[10px] text-text-muted">{item.structured_formatting.secondary_text}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

