import React, { useState, useEffect } from 'react';
import { Job, Proposal, Escrow, EscrowStatus } from '../types';
import StatCard from './StatCard';
import * as API from '../services/api';

const statusStyles: { [key in EscrowStatus]: { bg: string, text: string } } = {
  bloqueado: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  liberado: { bg: 'bg-green-100', text: 'text-green-800' },
  reembolsado: { bg: 'bg-red-100', text: 'text-red-800' },
  em_disputa: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

const AdminFinancials: React.FC = () => {
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [allProposals, setAllProposals] = useState<Proposal[]>([]);
    const [allEscrows, _setAllEscrows] = useState<Escrow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [jobs, proposals] = await Promise.all([
                    API.fetchJobs(),
                    API.fetchProposals(),
                    // API.fetchEscrows(), // Supondo que exista um endpoint para isso
                ]);
                setAllJobs(jobs);
                setAllProposals(proposals);
                // setAllEscrows(escrows);
            } catch (error) {
                console.error("Failed to load financial data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);
    
    const completedJobs = allJobs.filter(j => j.status === 'concluido');
    const completedJobProposals = allProposals.filter(p => completedJobs.some(j => j.id === p.jobId && p.status === 'aceita'));

    const gmv = completedJobProposals.reduce((acc, proposal) => acc + proposal.price, 0);
    const platformRevenue = gmv * 0.15; // Assuming 15% commission
    const totalInEscrow = allEscrows.filter(e => e.status === 'bloqueado' || e.status === 'em_disputa').reduce((acc, e) => acc + e.amount, 0);

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (isLoading) {
        return <div className="p-4 text-sm text-gray-600">Carregando dados financeiros...</div>;
    }
  
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="GMV (Total Transacionado)" value={formatCurrency(gmv)} icon={<p>💰</p>} />
                <StatCard title="Receita da Plataforma" value={formatCurrency(platformRevenue)} icon={<p>📈</p>} />
                <StatCard title="Total em Custódia (Escrow)" value={formatCurrency(totalInEscrow)} icon={<p>🔒</p>} />
            </div>
            
             <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-800 p-4 border-b">Histórico de Transações de Custódia (Escrow)</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID da Transação</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Job ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Valor</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Data</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allEscrows.map(escrow => {
                                const statusStyle = statusStyles[escrow.status];
                                return (
                                    <tr key={escrow.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{escrow.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-mono">{escrow.jobId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(escrow.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                                {escrow.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(escrow.createdAt).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminFinancials;