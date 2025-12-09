/**
 * TwilioIntegrationDashboard - Dashboard para gerenciar comunicações Twilio
 * 
 * Funcionalidades:
 * - Envio de SMS individual
 * - Envio de WhatsApp individual
 * - Realização de chamadas telefônicas
 * - Histórico de comunicações por prospect
 * - Status de saúde da conexão Twilio
 * - Envio em batch (múltiplos prospects)
 * 
 * @component TwilioIntegrationDashboard
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Send as SendIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface Communication {
  id: string;
  type: 'sms' | 'whatsapp' | 'call';
  direction: 'inbound' | 'outbound';
  to: string;
  from: string;
  body?: string;
  status: string;
  twilioSid: string;
  timestamp: Date;
  duration?: number;
  recordingUrl?: string;
  error?: string;
}

interface TwilioHealth {
  healthy: boolean;
  accountSid?: string;
  accountStatus?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  error?: string;
}

export const TwilioIntegrationDashboard: React.FC = () => {
  // State para health check
  const [twilioHealth, setTwilioHealth] = useState<TwilioHealth | null>(null);
  const [loading, setLoading] = useState(false);

  // State para envio de SMS
  const [smsDialog, setSmsDialog] = useState(false);
  const [smsData, setSmsData] = useState({
    to: '',
    body: '',
    prospectId: '',
  });

  // State para envio de WhatsApp
  const [whatsappDialog, setWhatsappDialog] = useState(false);
  const [whatsappData, setWhatsappData] = useState({
    to: '',
    body: '',
    prospectId: '',
    mediaUrl: '',
  });

  // State para chamada
  const [callDialog, setCallDialog] = useState(false);
  const [callData, setCallData] = useState({
    to: '',
    prospectId: '',
    callbackUrl: '',
    record: true,
  });

  // State para histórico
  const [historyDialog, setHistoryDialog] = useState(false);
  const [historyProspectId, setHistoryProspectId] = useState('');
  const [historyType, setHistoryType] = useState<'all' | 'sms' | 'whatsapp' | 'call'>('all');
  const [communications, setCommunications] = useState<Communication[]>([]);

  // State para alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State para tab
  const [activeTab, setActiveTab] = useState(0);

  /**
   * Carrega status de saúde do Twilio
   */
  const checkTwilioHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/twilio/health');
      const result = await response.json();

      if (result.success) {
        setTwilioHealth(result.data);
        showAlert('success', 'Twilio connection healthy');
      } else {
        setTwilioHealth({ healthy: false, error: result.error });
        showAlert('error', `Twilio health check failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error checking Twilio health:', error);
      showAlert('error', 'Failed to check Twilio health');
      setTwilioHealth({ healthy: false, error: 'Connection failed' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envia SMS individual
   */
  const sendSMS = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsData),
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', `SMS sent successfully (SID: ${result.data.messageSid})`);
        setSmsDialog(false);
        setSmsData({ to: '', body: '', prospectId: '' });
      } else {
        showAlert('error', `Failed to send SMS: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      showAlert('error', 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envia WhatsApp individual
   */
  const sendWhatsApp = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/twilio/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappData),
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', `WhatsApp sent successfully (SID: ${result.data.messageSid})`);
        setWhatsappDialog(false);
        setWhatsappData({ to: '', body: '', prospectId: '', mediaUrl: '' });
      } else {
        showAlert('error', `Failed to send WhatsApp: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      showAlert('error', 'Failed to send WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza chamada telefônica
   */
  const makeCall = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/twilio/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData),
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', `Call initiated successfully (SID: ${result.data.callSid})`);
        setCallDialog(false);
        setCallData({ to: '', prospectId: '', callbackUrl: '', record: true });
      } else {
        showAlert('error', `Failed to make call: ${result.error}`);
      }
    } catch (error) {
      console.error('Error making call:', error);
      showAlert('error', 'Failed to make call');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega histórico de comunicações
   */
  const loadHistory = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/twilio/history/${historyProspectId}?type=${historyType}`
      );
      const result = await response.json();

      if (result.success) {
        setCommunications(result.data.communications);
        showAlert('success', `Loaded ${result.data.count} communications`);
      } else {
        showAlert('error', `Failed to load history: ${result.error}`);
        setCommunications([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      showAlert('error', 'Failed to load history');
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exibe alert temporário
   */
  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  /**
   * Carrega health check ao montar componente
   */
  useEffect(() => {
    checkTwilioHealth();
  }, []);

  /**
   * Renderiza status chip
   */
  const renderStatusChip = (status: string) => {
    const statusColors: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
      sent: 'success',
      delivered: 'success',
      read: 'success',
      failed: 'error',
      undelivered: 'error',
      queued: 'info',
      sending: 'info',
      completed: 'success',
      busy: 'warning',
      'no-answer': 'warning',
    };

    return (
      <Chip
        label={status}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  /**
   * Formata timestamp
   */
  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Twilio Integration Dashboard</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={checkTwilioHealth}
          disabled={loading}
        >
          Refresh Health
        </Button>
      </Box>

      {/* Alert */}
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Health Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Twilio Connection Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {twilioHealth?.healthy ? (
                  <CheckIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
                <Typography variant="body1">
                  Status: {twilioHealth?.healthy ? 'Healthy' : 'Unhealthy'}
                </Typography>
              </Box>
            </Grid>
            {twilioHealth?.healthy && (
              <>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1">{twilioHealth.phoneNumber}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    WhatsApp Number
                  </Typography>
                  <Typography variant="body1">{twilioHealth.whatsappNumber}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Account Status
                  </Typography>
                  <Typography variant="body1">{twilioHealth.accountStatus}</Typography>
                </Grid>
              </>
            )}
            {twilioHealth?.error && (
              <Grid item xs={12}>
                <Alert severity="error">{twilioHealth.error}</Alert>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Send Communications" />
        <Tab label="History" />
      </Tabs>

      {/* Tab Panel 0: Send Communications */}
      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Send SMS
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  fullWidth
                  onClick={() => setSmsDialog(true)}
                  disabled={!twilioHealth?.healthy}
                >
                  Send SMS
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Send WhatsApp
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<WhatsAppIcon />}
                  fullWidth
                  color="success"
                  onClick={() => setWhatsappDialog(true)}
                  disabled={!twilioHealth?.healthy}
                >
                  Send WhatsApp
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Make Call
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PhoneIcon />}
                  fullWidth
                  color="secondary"
                  onClick={() => setCallDialog(true)}
                  disabled={!twilioHealth?.healthy}
                >
                  Make Call
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab Panel 1: History */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Prospect ID"
                  fullWidth
                  value={historyProspectId}
                  onChange={(e) => setHistoryProspectId(e.target.value)}
                  placeholder="Enter prospect ID"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={historyType}
                    label="Type"
                    onChange={(e) => setHistoryType(e.target.value as any)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                    <MenuItem value="call">Call</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  startIcon={<HistoryIcon />}
                  fullWidth
                  onClick={loadHistory}
                  disabled={loading || !historyProspectId}
                  sx={{ height: '56px' }}
                >
                  Load
                </Button>
              </Grid>
            </Grid>

            {communications.length > 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Direction</TableCell>
                      <TableCell>To/From</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {communications.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell>
                          <Chip label={comm.type.toUpperCase()} size="small" />
                        </TableCell>
                        <TableCell>{comm.direction}</TableCell>
                        <TableCell>
                          {comm.direction === 'outbound' ? comm.to : comm.from}
                        </TableCell>
                        <TableCell>{renderStatusChip(comm.status)}</TableCell>
                        <TableCell>{formatTimestamp(comm.timestamp)}</TableCell>
                        <TableCell>
                          {comm.body && (
                            <Tooltip title={comm.body}>
                              <span>{comm.body.substring(0, 30)}...</span>
                            </Tooltip>
                          )}
                          {comm.duration && <span> ({comm.duration}s)</span>}
                          {comm.recordingUrl && (
                            <IconButton
                              size="small"
                              href={comm.recordingUrl}
                              target="_blank"
                            >
                              🎙️
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* SMS Dialog */}
      <Dialog open={smsDialog} onClose={() => setSmsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send SMS</DialogTitle>
        <DialogContent>
          <TextField
            label="To (Phone Number)"
            fullWidth
            margin="normal"
            value={smsData.to}
            onChange={(e) => setSmsData({ ...smsData, to: e.target.value })}
            placeholder="+5511999999999"
            helperText="Use E.164 format"
          />
          <TextField
            label="Prospect ID"
            fullWidth
            margin="normal"
            value={smsData.prospectId}
            onChange={(e) => setSmsData({ ...smsData, prospectId: e.target.value })}
          />
          <TextField
            label="Message"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={smsData.body}
            onChange={(e) => setSmsData({ ...smsData, body: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmsDialog(false)}>Cancel</Button>
          <Button
            onClick={sendSMS}
            variant="contained"
            disabled={loading || !smsData.to || !smsData.body || !smsData.prospectId}
          >
            Send SMS
          </Button>
        </DialogActions>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsappDialog} onClose={() => setWhatsappDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send WhatsApp</DialogTitle>
        <DialogContent>
          <TextField
            label="To (Phone Number)"
            fullWidth
            margin="normal"
            value={whatsappData.to}
            onChange={(e) => setWhatsappData({ ...whatsappData, to: e.target.value })}
            placeholder="+5511999999999"
            helperText="Use E.164 format"
          />
          <TextField
            label="Prospect ID"
            fullWidth
            margin="normal"
            value={whatsappData.prospectId}
            onChange={(e) => setWhatsappData({ ...whatsappData, prospectId: e.target.value })}
          />
          <TextField
            label="Message"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={whatsappData.body}
            onChange={(e) => setWhatsappData({ ...whatsappData, body: e.target.value })}
          />
          <TextField
            label="Media URL (optional)"
            fullWidth
            margin="normal"
            value={whatsappData.mediaUrl}
            onChange={(e) => setWhatsappData({ ...whatsappData, mediaUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWhatsappDialog(false)}>Cancel</Button>
          <Button
            onClick={sendWhatsApp}
            variant="contained"
            color="success"
            disabled={loading || !whatsappData.to || !whatsappData.body || !whatsappData.prospectId}
          >
            Send WhatsApp
          </Button>
        </DialogActions>
      </Dialog>

      {/* Call Dialog */}
      <Dialog open={callDialog} onClose={() => setCallDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Make Call</DialogTitle>
        <DialogContent>
          <TextField
            label="To (Phone Number)"
            fullWidth
            margin="normal"
            value={callData.to}
            onChange={(e) => setCallData({ ...callData, to: e.target.value })}
            placeholder="+5511999999999"
            helperText="Use E.164 format"
          />
          <TextField
            label="Prospect ID"
            fullWidth
            margin="normal"
            value={callData.prospectId}
            onChange={(e) => setCallData({ ...callData, prospectId: e.target.value })}
          />
          <TextField
            label="Callback URL (TwiML)"
            fullWidth
            margin="normal"
            value={callData.callbackUrl}
            onChange={(e) => setCallData({ ...callData, callbackUrl: e.target.value })}
            placeholder="https://yourapp.com/twiml/greeting"
            helperText="URL that returns TwiML instructions"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCallDialog(false)}>Cancel</Button>
          <Button
            onClick={makeCall}
            variant="contained"
            color="secondary"
            disabled={loading || !callData.to || !callData.prospectId || !callData.callbackUrl}
          >
            Make Call
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TwilioIntegrationDashboard;
