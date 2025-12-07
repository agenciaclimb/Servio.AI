import React, { useState, useEffect } from 'react';
import { MaintainedItem, MaintenanceSuggestion } from '../types';
import { suggestMaintenance } from '../services/geminiService';

interface MaintenanceSuggestionsProps {
  items: MaintainedItem[];
  onSuggestJob: (prompt: string) => void;
}

interface Suggestion extends MaintenanceSuggestion {
  item: MaintainedItem;
}

const SuggestionCard: React.FC<{
  suggestion: Suggestion;
  onSuggestJob: (prompt: string) => void;
}> = ({ suggestion, onSuggestJob }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col sm:flex-row items-center p-4 min-w-[320px] sm:min-w-[400px] flex-shrink-0">
    <img
      src={suggestion.item.imageUrl}
      alt={suggestion.item.name}
      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
      loading="lazy"
      width="96"
      height="96"
    />
    <div className="ml-0 mt-4 sm:ml-4 sm:mt-0 text-center sm:text-left flex-grow">
      <h4 className="font-bold text-indigo-800 bg-indigo-100 px-2 py-1 rounded-md inline-block text-sm">
        {suggestion.suggestionTitle}
      </h4>
      <p className="text-sm text-gray-600 mt-2">
        Nossa IA recomenda uma manutenção preventiva para seu{' '}
        <strong>{suggestion.item.name}</strong>.
      </p>
      <button
        onClick={() => onSuggestJob(suggestion.jobDescription)}
        className="mt-3 w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Agendar Manutenção ✨
      </button>
    </div>
  </div>
);

const MaintenanceSuggestions: React.FC<MaintenanceSuggestionsProps> = ({ items, onSuggestJob }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      const newSuggestions: Suggestion[] = [];
      for (const item of items) {
        try {
          const result = await suggestMaintenance(item);
          if (result) {
            newSuggestions.push({ ...result, item });
          }
        } catch (error) {
          console.error(`Failed to get suggestion for item ${item.id}:`, error);
        }
      }
      setSuggestions(newSuggestions);
      setIsLoading(false);
    };

    fetchSuggestions();
  }, [items]);

  if (isLoading) {
    return (
      <div className="bg-slate-100 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-600 animate-pulse">
          Buscando sugestões inteligentes para seus itens...
        </p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't render anything if there are no suggestions
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl shadow-sm border">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Sugestões da IA para Você</h3>
      <div className="flex space-x-4 overflow-x-auto pb-4 -mb-4">
        {suggestions.map(suggestion => (
          <SuggestionCard
            key={suggestion.item.id}
            suggestion={suggestion}
            onSuggestJob={onSuggestJob}
          />
        ))}
      </div>
    </div>
  );
};

export default MaintenanceSuggestions;
