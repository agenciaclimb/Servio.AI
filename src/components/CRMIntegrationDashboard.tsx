/**
 * CRM Integration Dashboard
 * Gerencia sincronização de leads com CRMs externos (Pipedrive, HubSpot)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Divider,
  Grid,
  Paper,
  CheckCircleIcon,
  ErrorIcon,
  RefreshIcon,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const CRMIntegrationDashboard = () => {
  const [prospects, setProspects] = useState([]);
  const [selectedProspects, setSelectedProspects] = useState(new Set());
  const [crmType, setCrmType] = useState('pipedrive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [crmHealth, setCrmHealth] = useState(null);
  const [syncHistory, setSyncHistory] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);

  useEffect(() => {
    checkCRMHealth();
    loadProspects();
  }, []);

  const checkCRMHealth = async () => {
    try {
      const response = await fetch('/api/crm/health');
      const data = await response.json();
      setCrmHealth(data.health);
    } catch (err) {
      console.error('Erro ao verificar saúde do CRM:', err);
    }
  };

  const loadProspects = async () => {
    try {
      setLoading(true);
      // Aqui você buscaria os prospects do seu banco de dados
      // Por enquanto, vamos usar dados mockados
      setProspects([
        {
          id: 'prospect1',
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@example.com',
          score: 85,
          status: 'novo',
          prospectorEmail: 'prospector1@servio.ai',
        },
        {
          id: 'prospect2',
          firstName: 'Maria',
          lastName: 'Santos',
          email: 'maria@example.com',
          score: 92,
          status: 'contatado',
          prospectorEmail: 'prospector1@servio.ai',
        },
        {
          id: 'prospect3',
          firstName: 'Carlos',
          lastName: 'Oliveira',
          email: 'carlos@example.com',
          score: 78,
          status: 'negociando',
          prospectorEmail: 'prospector2@servio.ai',
        },
      ]);
    } catch (err) {
      setError(`Erro ao carregar prospects: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProspectSelect = (prospectId) => {
    const newSelected = new Set(selectedProspects);
    if (newSelected.has(prospectId)) {
      newSelected.delete(prospectId);
    } else {
      newSelected.add(prospectId);
    }
    setSelectedProspects(newSelected);
  };

  const syncSingleLead = async (prospect) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/crm/sync-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: prospect.id,
          prospectorEmail: prospect.prospectorEmail,
          crmType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setSuccess(
        `Lead sincronizado com sucesso para ${crmType}: ${data.result.action}`
      );

      // Carregar histórico de sincronização
      await loadSyncHistory(prospect.id);
    } catch (err) {
      setError(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const syncBatch = async () => {
    if (selectedProspects.size === 0) {
      setError('Selecione pelo menos um prospect');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/crm/sync-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectIds: Array.from(selectedProspects),
          crmType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setSuccess(
        `${data.result.successful} leads sincronizados, ${data.result.failed} falharam`
      );
      setSelectedProspects(new Set());

      // Recarregar prospects
      await loadProspects();
    } catch (err) {
      setError(`Erro ao sincronizar batch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncHistory = async (prospectId) => {
    try {
      const response = await fetch(`/api/crm/sync-status/${prospectId}`);
      const data = await response.json();

      setSyncHistory((prev) => ({
        ...prev,
        [prospectId]: data.syncHistory,
      }));
    } catch (err) {
      console.error('Erro ao carregar histórico de sincronização:', err);
    }
  };

  const openProspectDialog = (prospect) => {
    setSelectedProspect(prospect);
    loadSyncHistory(prospect.id);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setSelectedProspect(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        CRM Integration Dashboard
      </Typography>

      {/* CRM Health Status */}
      {crmHealth && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {crmHealth.pipedriveStatus === 'connected' ? (
                  <CheckCircle sx={{ color: 'green' }} />
                ) : (
                  <ErrorIcon sx={{ color: 'red' }} />
                )}
                <Typography variant="body2">
                  Pipedrive:{' '}
                  <strong>{crmHealth.pipedriveStatus || 'não configurado'}</strong>
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {crmHealth.hubspotStatus === 'connected' ? (
                  <CheckCircle sx={{ color: 'green' }} />
                ) : (
                  <ErrorIcon sx={{ color: 'red' }} />
                )}
                <Typography variant="body2">
                  HubSpot:{' '}
                  <strong>{crmHealth.hubspotStatus || 'não configurado'}</strong>
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={checkCRMHealth}
                  variant="outlined"
                >
                  Verificar Status
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mb: 2 }}
        >
          {success}
        </Alert>
      )}

      {/* Sync Controls */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Sincronizar Prospects" />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>CRM Destino</InputLabel>
              <Select value={crmType} onChange={(e) => setCrmType(e.target.value)}>
                <MenuItem value="pipedrive">Pipedrive</MenuItem>
                <MenuItem value="hubspot">HubSpot</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SyncIcon />}
              onClick={syncBatch}
              disabled={selectedProspects.size === 0 || loading}
            >
              Sincronizar ({selectedProspects.size})
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSelectedProspects(new Set())}
              disabled={selectedProspects.size === 0}
            >
              Limpar Seleção
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Prospects Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={
                    selectedProspects.size === prospects.length &&
                    prospects.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProspects(
                        new Set(prospects.map((p) => p.id))
                      );
                    } else {
                      setSelectedProspects(new Set());
                    }
                  }}
                />
              </TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              prospects.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedProspects.has(prospect.id)}
                      onChange={() => handleProspectSelect(prospect.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {prospect.firstName} {prospect.lastName}
                  </TableCell>
                  <TableCell>{prospect.email}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${prospect.score}`}
                      color={prospect.score >= 80 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={prospect.status} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openProspectDialog(prospect)}
                    >
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Prospect Details Dialog */}
      {selectedProspect && (
        <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Detalhes do Prospect - Histórico de Sincronização
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                <strong>Nome:</strong> {selectedProspect.firstName}{' '}
                {selectedProspect.lastName}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                <strong>Email:</strong> {selectedProspect.email}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                <strong>Score:</strong> {selectedProspect.score}/100
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 1 }}>
                Histórico de Sincronização
              </Typography>

              {syncHistory[selectedProspect.id]?.length > 0 ? (
                <Box>
                  {syncHistory[selectedProspect.id].map(
                    (sync, idx) => (
                      <Paper
                        key={idx}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          backgroundColor:
                            sync.success === false ? '#ffebee' : '#e8f5e9',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {sync.crmType.toUpperCase()} - {sync.action}
                          </Typography>
                          {sync.success ? (
                            <CheckCircle sx={{ color: 'green', fontSize: 18 }} />
                          ) : (
                            <ErrorIcon sx={{ color: 'red', fontSize: 18 }} />
                          )}
                        </Box>
                        <Typography variant="caption">
                          {new Date(sync.timestamp).toLocaleString('pt-BR')}
                        </Typography>
                      </Paper>
                    )
                  )}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#999' }}>
                  Nenhuma sincronização realizada ainda
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Fechar</Button>
            <Button
              variant="contained"
              onClick={() => {
                syncSingleLead(selectedProspect);
                closeDialog();
              }}
              disabled={loading}
            >
              Sincronizar Agora
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default CRMIntegrationDashboard;
