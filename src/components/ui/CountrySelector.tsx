'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COUNTRIES, Country } from '@/lib/constants/countries';
import { motion, AnimatePresence } from 'framer-motion';

interface CountrySelectorProps {
    selectedCountry: Country;
    onSelect: (country: Country) => void;
    className?: string;
}

export function CountrySelector({ selectedCountry, onSelect, className }: CountrySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredCountries = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 h-full bg-surface/80 border-l-2 border-white/10 hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground focus:outline-none"
            >
                <span className="text-xl">{selectedCountry.flag}</span>
                <span className="font-bold text-lg uppercase">{selectedCountry.code}</span>
                <ChevronDown className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-72 z-[100] bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                    >
                        {/* Search */}
                        <div className="p-3 border-b border-white/10 bg-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Enter country"
                                    className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto custom-scroll py-2">
                            {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                    <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => {
                                            onSelect(country);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors group",
                                            selectedCountry.code === country.code && "bg-brand-500/10 text-brand-400"
                                        )}
                                    >
                                        <span className="text-xl">{country.flag}</span>
                                        <span className="flex-1 font-medium">{country.name}</span>
                                        {selectedCountry.code === country.code && (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                                    No countries found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
