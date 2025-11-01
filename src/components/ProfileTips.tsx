import React, { useState, useEffect } from 'react';
import { User } from '../../types';

import { auth } from '../../firebaseConfig'; // Import auth for token
interface ProfileTipsProps {
  user: User;
  onEditProfile: () => void;
}

const ProfileTips: React.FC<ProfileTipsProps> = ({ user, onEditProfile }) => {
  const [tip, setTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      const token = await auth.currentUser?.getIdToken();
      try {
        const response = await fetch(`${process.env.REACT_APP_AI_API_URL}/api/generate-tip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ user }),
        });
        const data = await response.json();
        setTip(data.tip);
      } catch (error) {
        console.error("Error fetching profile tip:", error);
        setTip("Não foi possível carregar a dica no momento.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTip();
  }, [user]);

  return (
    <div className="p-4 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
      <div className="flex items-start space-x-4">
        <span className="text-2xl mt-1">💡</span>
        <div>
          <h3 className="font-bold text-blue-800 dark:text-blue-200">Dica Rápida da IA</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            {isLoading ? 'Analisando seu perfil para encontrar oportunidades de melhoria...' : tip}
          </p>
          {!isLoading && tip && (
            <button onClick={onEditProfile} className="mt-3 px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Editar Perfil
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileTips;