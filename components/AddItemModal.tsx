
import React, { useState, useCallback } from 'react';
import { IdentifiedItem, MaintainedItem } from '../types';
import { identifyItemFromImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface AddItemModalProps {
  onClose: () => void;
  // FIX: Update `onSave` prop type to exclude `createdAt` as it is handled by the parent component.
  onSave: (newItemData: Omit<MaintainedItem, 'id' | 'clientId' | 'maintenanceHistory' | 'createdAt'>) => void;
}

// Helper to convert file to base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});


const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onSave }) => {
  const [step, setStep] = useState<'upload' | 'loading' | 'review'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  // Form state for the review step
  // FIX: Update the state type to exclude `createdAt` to match the onSave prop and fix type errors.
  const [formState, setFormState] = useState<Omit<MaintainedItem, 'id' | 'clientId' | 'maintenanceHistory' | 'createdAt'>>({
      name: '',
      category: '',
      brand: '',
      model: '',
      serialNumber: '',
      notes: '',
      imageUrl: ''
  });

  const handleFileChange = useCallback(async (file: File | null) => {
    if (!file) return;
    
    if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini
        setError('O arquivo é muito grande. Por favor, escolha uma imagem menor que 4MB.');
        return;
    }

    setStep('loading');
    setError(null);
    const dataUrl = URL.createObjectURL(file);
    setImageDataUrl(dataUrl);

    try {
      const base64Image = await toBase64(file);
      const result = await identifyItemFromImage(base64Image, file.type);
      
      setFormState({
          name: result.itemName,
          category: result.category,
          brand: result.brand,
          model: result.model,
          serialNumber: result.serialNumber,
          notes: '',
          imageUrl: dataUrl, // Use local blob URL for preview
      });

      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
      setStep('upload'); // Go back to upload on error
    }
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileChange(event.dataTransfer.files[0]);
    }
  }, [handleFileChange]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formState);
  };
  
  const renderContent = () => {
    switch(step) {
      case 'upload':
        return (
             <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Adicionar Novo Item</h2>
                <p className="text-gray-600 mb-6">Carregue uma foto e deixe a IA fazer o trabalho pesado.</p>
                <div 
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-gray-300 border-dashed rounded-md"
                >
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                <span>Carregue uma foto</span>
                                <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
                            </label>
                            <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-gray-600">PNG, JPG, GIF até 4MB</p>
                    </div>
                </div>
                {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
            </div>
        );
      case 'loading':
          return <div className="p-8"><LoadingSpinner/></div>;
      case 'review':
          return (
             <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="p-8 flex-grow overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Revise as Informações</h2>
                    <p className="text-gray-600 mb-6">A IA preencheu os detalhes. Edite se necessário.</p>
                    
                    <div className="space-y-4">
                        {imageDataUrl && (
                            <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                                <img src={imageDataUrl} alt="Item preview" className="w-full h-full object-contain" />
                            </div>
                        )}
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Item*</label>
                            <input type="text" name="name" id="name" required value={formState.name} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                                <input type="text" name="category" id="category" value={formState.category} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Marca</label>
                                <input type="text" name="brand" id="brand" value={formState.brand} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="model" className="block text-sm font-medium text-gray-700">Modelo</label>
                                <input type="text" name="model" id="model" value={formState.model} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Número de Série</label>
                                <input type="text" name="serialNumber" id="serialNumber" value={formState.serialNumber} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas Adicionais</label>
                            <textarea name="notes" id="notes" rows={3} value={formState.notes} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex-shrink-0 text-right space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">Salvar Item</button>
                </div>
             </form>
          );
    }
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex-grow">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-600 z-10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;