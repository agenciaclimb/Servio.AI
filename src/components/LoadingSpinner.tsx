
import React, { useState, useEffect, memo } from 'react';

const loadingMessages = [
    "Analisando sua solicitação...",
    "Buscando os melhores profissionais...",
    "Avaliando compatibilidade com IA...",
    "Personalizando suas recomendações...",
    "Quase pronto!"
];

const LoadingSpinner: React.FC = memo(() => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = loadingMessages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="text-center py-10">
            <div className="flex justify-center items-center mb-4">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 transition-opacity duration-500">{message}</p>
        </div>
    );
});

export default LoadingSpinner;
