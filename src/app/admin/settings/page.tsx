'use client';

import { useState, useEffect } from 'react';
import {
    Settings, Globe, Mail, Key, Shield,
    Bell, Save, RefreshCw, AlertCircle,
    Lock, Database, Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SystemSettingsPage() {
    const [settings, setSettings] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/admin/settings');
                const data = await res.json();
                if (res.ok) setSettings(data);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const updateSetting = async (key: string, value: string, group: string = 'GENERAL') => {
        setIsSaving(true);
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value, group })
            });
            setSettings({ ...settings, [key]: value });
        } catch (error) {
            alert('Failed to update setting');
        } finally {
            setIsSaving(false);
        }
    };

    const sections = [
        {
            title: 'General Branding',
            icon: Settings,
            fields: [
                { key: 'site_name', label: 'Website Name', type: 'text', placeholder: 'Seoptima' },
                { key: 'site_description', label: 'Meta Description', type: 'textarea', placeholder: 'AI SEO Platform...' },
                { key: 'support_email', label: 'Support Email', type: 'email', placeholder: 'support@seoptima.com' },
            ]
        },
        {
            title: 'API & External Services',
            icon: Key,
            fields: [
                { key: 'openai_api_key', label: 'OpenAI API Key', type: 'password', placeholder: 'sk-...' },
                { key: 'serp_api_key', label: 'SERP API Key', type: 'password', placeholder: '...' },
                { key: 'google_client_id', label: 'Google Client ID', type: 'text', placeholder: '...' },
            ]
        },
        {
            title: 'Platform Maintenance',
            icon: Shield,
            fields: [
                { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'select', options: ['OFF', 'ON'] },
                { key: 'default_language', label: 'Default Language', type: 'select', options: ['English', 'Spanish', 'French', 'German'] },
            ]
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold font-display">System Settings</h1>
                <p className="text-muted-foreground mt-1">Configure global platform parameters, API keys, and branding.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sections.map((section) => (
                    <div key={section.title} className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                            <section.icon className="w-5 h-5 text-brand-400" />
                            <h2 className="font-semibold">{section.title}</h2>
                        </div>
                        <div className="space-y-6">
                            {section.fields.map((field) => (
                                <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
                                    <div className="md:col-span-2 flex gap-2">
                                        {field.type === 'select' ? (
                                            <select
                                                className="input-base w-full"
                                                value={settings[field.key] || field.options?.[0]}
                                                onChange={(e) => updateSetting(field.key, e.target.value)}
                                            >
                                                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                className="input-base w-full h-24"
                                                placeholder={field.placeholder}
                                                value={settings[field.key] || ''}
                                                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                                                onBlur={(e) => updateSetting(field.key, e.target.value)}
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                className="input-base w-full"
                                                placeholder={field.placeholder}
                                                value={settings[field.key] || ''}
                                                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                                                onBlur={(e) => updateSetting(field.key, e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/8">
                <button className="btn-secondary py-2 text-sm flex items-center gap-2">
                    <RefreshCw className={cn("w-4 h-4", isSaving && "animate-spin")} />
                    Update All
                </button>
                <button className="btn-primary py-2 text-sm">Save Changes</button>
            </div>
        </div>
    );
}
