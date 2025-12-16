/**
 * Dashboard de Status do Protocolo Supremo v4.0 - Task 3.5
 * Monitora métricas em tempo real de tasks, PRs, builds e health score
 */

import React, { useState, useEffect } from 'react';
import {
  protocolMetrics,
  ProtocolStatus,
  TaskMetric,
  PRMetric,
  BuildMetric,
} from '../services/protocolMetricsService';
import {
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  GitPullRequest,
  Package,
} from 'lucide-react';

export const ProtocolDashboard: React.FC = () => {
  const [status, setStatus] = useState<ProtocolStatus | null>(null);
  const [tasks, setTasks] = useState<TaskMetric[]>([]);
  const [prs, setPRs] = useState<PRMetric[]>([]);
  const [builds, setBuilds] = useState<BuildMetric[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [statusData, tasksData, prsData, buildsData, insightsData] = await Promise.all([
        protocolMetrics.getProtocolStatus(),
        protocolMetrics.getRecentTasks(),
        protocolMetrics.getRecentPRs(),
        protocolMetrics.getRecentBuilds(),
        protocolMetrics.generateInsights(),
      ]);

      setStatus(statusData);
      setTasks(tasksData);
      setPRs(prsData);
      setBuilds(buildsData);
      setInsights(insightsData);
      setHealthScore(protocolMetrics.calculateHealthScore(statusData));
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando métricas do protocolo...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'completed':
      case 'merged':
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
      case 'open':
        return 'text-blue-600 bg-blue-100';
      case 'blocked':
      case 'failure':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-600 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-600" />
            Dashboard - Protocolo Supremo v{status?.version}
          </h1>
          <p className="mt-2 text-gray-600">
            Monitoramento em tempo real • Atualizado: {formatDate(status?.lastUpdate || new Date())}
          </p>
        </div>

        {/* Health Score Card */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold opacity-90">Health Score do Protocolo</h2>
              <p className="text-4xl font-bold mt-2">{healthScore}/100</p>
              <p className="text-sm opacity-75 mt-1">
                Fase Atual: {status?.currentPhase} • {status?.tasksCompleted}/{status?.tasksTotal}{' '}
                tasks completas
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold opacity-20">
                {healthScore >= 80 ? '🚀' : healthScore >= 60 ? '⚡' : '⏳'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasks Completas</p>
                <p className="text-2xl font-bold text-gray-900">{status?.tasksCompleted}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Progresso</p>
                <p className="text-2xl font-bold text-gray-900">{status?.tasksInProgress}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bloqueadas</p>
                <p className="text-2xl font-bold text-gray-900">{status?.tasksBlocked}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Audit Score</p>
                <p className="text-2xl font-bold text-gray-900">{status?.avgAuditScore}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Insights do Protocolo
            </h3>
            <ul className="space-y-1">
              {insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-blue-800">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              Tasks Recentes
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Agente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    PR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{task.title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{task.assignedTo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.duration ? formatDuration(task.duration) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{task.pr || '-'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {task.auditScore ? `${task.auditScore}/100` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRs & Builds Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PRs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-purple-600" />
                Pull Requests
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {prs.map(pr => (
                <div
                  key={pr.number}
                  className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        #{pr.number} - {pr.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(pr.status)}`}
                        >
                          {pr.status}
                        </span>
                        {pr.riskLevel && (
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getRiskColor(pr.riskLevel)}`}
                          >
                            {pr.riskLevel}
                          </span>
                        )}
                        {pr.auditScore && (
                          <span className="text-xs text-gray-600">Score: {pr.auditScore}/100</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(pr.createdAt)} • +{pr.additions} -{pr.deletions}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Builds */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Builds Recentes
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {builds.map((build, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(build.status)}`}
                        >
                          {build.status}
                        </span>
                        <span className="text-xs text-gray-600">{build.branch}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(build.timestamp)} • {build.duration}s •{' '}
                        {build.commit.substring(0, 7)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolDashboard;
