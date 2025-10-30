import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { generateProfileTip } from '../services/geminiService';

interface ProfileTipsProps {
    user: User;
    onEditProfile: () => void;
}

const ProfileTips: React.FC<ProfileTipsProps> = ({ user, onEditProfile }) => {
    const [tip, setTip] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTip = async () => {
            setIsLoading(true);
            try {
                const generatedTip = await generateProfileTip(user);
                setTip(generatedTip);
            } catch (error) {
                console.error("Failed to fetch profile tip:", error);
                setTip("Complete seu perfil para receber mais propostas!");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTip();
    }, [user]); // Re-fetch if user data changes

    return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold text-lg flex items-center">
                <span className="text-2xl mr-3">💡</span>
                Dica Rápida da IA
            </h3>
            <div className="mt-3 text-blue-100 text-sm min-h-[40px]">
                {isLoading ? (
                    <p className="animate-pulse">Analisando seu perfil para uma dica...</p>
                ) : (
                    <p>"{tip}"</p>
                )}
            </div>
             <button
                onClick={onEditProfile}
                className="mt-4 w-full text-center py-2 px-4 rounded-lg text-sm font-bold transition-colors bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
            >
                Editar Perfil
            </button>
        </div>
    );
};

export default ProfileTips;