import React, { useState, useEffect, useMemo } from 'react';
import { Job, Bid, User } from '../../types';

interface AuctionRoomModalProps {
  job: Job;
  currentUser: User;
  bids: Bid[];
  onClose: () => void;
  onPlaceBid: (jobId: string, amount: number) => void;
}

const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const hasEnded = !Object.values(timeLeft).some(val => val > 0);

    return (
        <div className="text-center">
            {hasEnded ? (
                <p className="text-2xl font-bold text-red-600">Leilão Encerrado</p>
            ) : (
                <div className="flex justify-center space-x-4">
                    {Object.entries(timeLeft).map(([interval, value]) => (
                        <div key={interval} className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-gray-800">{value.toString().padStart(2, '0')}</span>
                            <span className="text-xs text-gray-500 uppercase">{interval}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AuctionRoomModal: React.FC<AuctionRoomModalProps> = ({ job, currentUser, bids: initialBids, onClose, onPlaceBid }) => {
    const [bids, setBids] = useState<Bid[]>(initialBids);
    const [newBidAmount, setNewBidAmount] = useState('');
    const [error, setError] = useState('');

    const isClientView = currentUser.type === 'cliente';
    const hasAuctionEnded = job.auctionEndDate ? new Date(job.auctionEndDate) < new Date() : true;

    // Memoize the anonymized bidders map
    const bidderAnonymizationMap = useMemo(() => {
        const uniqueProviderIds = [...new Set(bids.map(bid => bid.providerId))];
        const map = new Map<string, string>();
        uniqueProviderIds.forEach((id, index) => {
            map.set(id, `Prestador ${String.fromCharCode(65 + index)}`);
        });
        return map;
    }, [bids]);
    
    // Simulate new bids from other providers
    useEffect(() => {
        if (hasAuctionEnded || isClientView) return;

        const interval = setInterval(() => {
            const lowestBid = bids.length > 0 ? Math.min(...bids.map(b => b.amount)) : 5000;
            const newFakeBidAmount = lowestBid - Math.floor(Math.random() * 50 + 25); // Decrease by 25-75

            if (newFakeBidAmount > 100) { // Don't let it go too low
                const newFakeBid: Bid = {
                    id: `fake-bid-${Date.now()}`,
                    jobId: job.id,
                    providerId: `fake-provider-${Math.random()}`,
                    amount: newFakeBidAmount,
                    createdAt: new Date().toISOString(),
                };
                setBids(prev => [...prev, newFakeBid].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        }, 8000); // New bid every 8 seconds

        return () => clearInterval(interval);
    }, [bids, hasAuctionEnded, isClientView, job.id]);

    const sortedBids = useMemo(() => {
        return [...bids].sort((a, b) => b.amount - a.amount);
    }, [bids]);

    const lowestBid = sortedBids.length > 0 ? sortedBids[sortedBids.length - 1].amount : null;

    const handlePlaceBid = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(newBidAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Por favor, insira um valor válido.');
            return;
        }
        if (lowestBid && amount >= lowestBid) {
            setError(`Seu lance deve ser menor que ${lowestBid.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}.`);
            return;
        }
        setError('');
        onPlaceBid(job.id, amount);
        setNewBidAmount('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl m-4 transform transition-all h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="relative p-6 border-b border-gray-200">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">Sala de Leilão ⚖️</h2>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 flex-grow min-h-0">
                    {/* Left Panel: Bids */}
                    <main className="md:col-span-2 flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50 border-r">
                        <h3 className="text-lg font-bold text-center text-gray-800 mb-4">Histórico de Lances</h3>
                        {sortedBids.length > 0 ? (
                            sortedBids.map((bid, index) => (
                                <div key={bid.id} className={`flex items-center p-3 rounded-lg ${index === sortedBids.length - 1 ? 'bg-green-100 border border-green-200' : 'bg-white'}`}>
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                                        {bidderAnonymizationMap.get(bid.providerId)?.charAt(10) || '?'}
                                    </div>
                                    <div className="ml-3 flex-grow">
                                        <p className="text-sm font-semibold text-gray-700">{bidderAnonymizationMap.get(bid.providerId) || 'Lance Anônimo'}</p>
                                        <p className="text-xs text-gray-500">{new Date(bid.createdAt).toLocaleString('pt-BR')}</p>
                                    </div>
                                    <p className="text-lg font-bold text-gray-800">{bid.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500">Seja o primeiro a dar um lance!</p>
                        )}
                    </main>

                    {/* Right Panel: Info & Bidding */}
                    <aside className="p-6 flex flex-col justify-between">
                       <div>
                         <div className="pb-6 border-b">
                            <h4 className="text-sm font-semibold text-gray-500 text-center mb-2">Tempo Restante</h4>
                            {job.auctionEndDate && <CountdownTimer endDate={job.auctionEndDate} />}
                        </div>
                        <div className="pt-6">
                            <h4 className="text-sm font-semibold text-gray-500 text-center mb-1">Menor Lance</h4>
                            <p className="text-4xl font-bold text-green-600 text-center">{lowestBid ? lowestBid.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : '---'}</p>
                        </div>
                       </div>
                        
                        {!isClientView && !hasAuctionEnded && (
                            <form onSubmit={handlePlaceBid} className="mt-6">
                                <label htmlFor="bid-amount" className="block text-sm font-medium text-gray-700">Seu lance (deve ser menor)</label>
                                <div className="relative mt-1 rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">R$</span>
                                    </div>
                                    <input type="number" name="bid-amount" id="bid-amount" step="1"
                                        value={newBidAmount}
                                        onChange={(e) => setNewBidAmount(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 pl-10 pr-4 py-2" placeholder="Ex: 3200.00"
                                        required
                                    />
                                </div>
                                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                                <button type="submit" className="w-full mt-3 px-4 py-3 text-sm font-medium text-white bg-blue-600 border rounded-lg hover:bg-blue-700">
                                    Confirmar Lance
                                </button>
                            </form>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default AuctionRoomModal;