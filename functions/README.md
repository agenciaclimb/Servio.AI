# Cloud Functions Deployment Guide

## 📦 Cloud Functions Overview

This directory contains Firebase Cloud Functions for Servio.AI platform automation:

1. **notifyOnNewMessage** - Sends notifications when new chat messages arrive
2. **updateProviderRate** - Dynamically recalculates provider commission rates
3. **cleanupOldNotifications** - Removes notifications older than 30 days

---

## 🚀 Deployment Steps

### Prerequisites

1. **Firebase CLI** installed:

```bash
npm install -g firebase-tools
```

2. **Firebase project** configured:

```bash
firebase login
firebase use servio-ai-project-id
```

3. **Service account** with Firestore permissions

---

### Deploy All Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

### Deploy Individual Function

```bash
# Deploy message notifications only
firebase deploy --only functions:notifyOnNewMessage

# Deploy rate calculator only
firebase deploy --only functions:updateProviderRate

# Deploy cleanup only
firebase deploy --only functions:cleanupOldNotifications
```

---

## 📋 Function Details

### 1. notifyOnNewMessage

**Trigger**: Firestore onCreate on `/messages/{messageId}`

**What it does**:

- Detects new chat messages
- Identifies recipient (opposite of sender)
- Creates notification in Firestore
- (Future) Sends push notification via FCM

**Environment**: Automatically triggered on message creation

**Example**:

```
User A sends message
  → Function triggers
  → Gets job details
  → Finds recipient (User B)
  → Creates notification for User B
  → (Optional) Push notification
```

---

### 2. updateProviderRate

**Trigger**: Firestore onUpdate on `/jobs/{jobId}` when status changes to 'concluido'

**What it does**:

- Recalculates provider commission rate
- Fetches completed jobs stats
- Applies bonus logic (75-85%)
- Updates `user.providerRate` field

**Rate Calculation**:

- Base: 75%
- +2% Profile complete (headline + verified)
- +2% High rating (4.8+)
- +3% Volume tier (revenue: 1.5k, 6k, 11k)
- +1% Low dispute rate (<5%)
- Cap: 85%

**Example**:

```
Job marked as 'concluido'
  → Function triggers
  → Fetches provider stats (jobs, revenue, rating, disputes)
  → Calculates new rate: 0.83 (83%)
  → Updates user.providerRate
```

---

### 3. cleanupOldNotifications

**Trigger**: Pub/Sub scheduled (daily at 2am BRT)

**What it does**:

- Finds notifications older than 30 days
- Deletes them in batches of 500
- Keeps Firestore database clean

**Schedule**: `0 2 * * *` (Every day at 2am São Paulo time)

**Example**:

```
2am daily
  → Function triggers
  → Query notifications where createdAt < 30 days ago
  → Batch delete up to 500
  → Log result
```

---

## 🔧 Configuration

### Environment Variables

Set in Firebase Console → Functions → Configuration:

```bash
# Not needed - uses Firebase Admin SDK automatically
# No external API keys required
```

### Firestore Indexes

Required indexes (auto-created on first use):

1. **jobs** collection:
   - `providerId` (ASC) + `status` (ASC)

2. **notifications** collection:
   - `createdAt` (ASC)

3. **disputes** collection:
   - `providerId` (ASC)

---

## 🧪 Testing Functions Locally

### Install Firebase Emulator Suite

```bash
firebase init emulators
# Select: Functions, Firestore
```

### Run Local Emulator

```bash
firebase emulators:start
```

### Trigger Functions Manually

```javascript
// Create test message (triggers notifyOnNewMessage)
const testMessage = {
  chatId: 'job-123',
  senderId: 'client@test.com',
  senderType: 'cliente',
  text: 'Test message',
  createdAt: new Date().toISOString(),
};

db.collection('messages').add(testMessage);
```

---

## 📊 Monitoring

### View Logs

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only notifyOnNewMessage

# Live tail
firebase functions:log --only updateProviderRate --tail
```

### Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select project → Functions
3. View execution logs, errors, and metrics

---

## 🛠️ Troubleshooting

### Function not triggering

**Check**:

1. Function deployed successfully
2. Firestore trigger path matches collection name
3. Service account has Firestore permissions

**Solution**:

```bash
firebase functions:log --only notifyOnNewMessage
# Check for permission errors
```

---

### High execution time

**Issue**: Function takes >10s to execute

**Solution**:

- Use batched reads/writes
- Limit query results
- Add indexes for complex queries

---

### Rate limits exceeded

**Issue**: Too many function invocations

**Solution**:

- Add debouncing logic
- Use batched operations
- Increase quota in GCP Console

---

## 💰 Cost Estimates

### Free Tier (Spark Plan)

- 2M invocations/month
- 400K GB-seconds/month
- 200K CPU-seconds/month

### Estimated Usage

- **notifyOnNewMessage**: ~1000 invocations/day = 30K/month ✅
- **updateProviderRate**: ~100 invocations/day = 3K/month ✅
- **cleanupOldNotifications**: 1 invocation/day = 30/month ✅

**Total**: ~33K invocations/month (well within free tier)

---

## 🔒 Security Rules

Functions run with **Admin SDK** privileges:

- Full read/write access to Firestore
- Bypass security rules
- Use with caution

**Best practices**:

1. Validate input data
2. Check user permissions
3. Log all actions
4. Handle errors gracefully

---

## 📚 Additional Resources

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
- [Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
- [Firebase Console](https://console.firebase.google.com/)

---

## ✅ Deployment Checklist

Before going live:

- [ ] All functions deployed successfully
- [ ] Logs show no errors
- [ ] Test message notification works
- [ ] Provider rate updates correctly
- [ ] Cleanup runs at 2am daily
- [ ] Monitoring alerts configured
- [ ] Cost tracking enabled
