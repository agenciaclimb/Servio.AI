import { describe, it } from 'vitest';

describe('Import Debug', () => {
  it('should import ReferralLinkGenerator', async () => {
    try {
      await import('../src/components/ReferralLinkGenerator');
      console.log('ReferralLinkGenerator imported');
    } catch (e) {
      console.error('Failed to import ReferralLinkGenerator', e);
      throw e;
    }
  });

  it('should import NotificationSettings', async () => {
    try {
      await import('../src/components/NotificationSettings');
      console.log('NotificationSettings imported');
    } catch (e) {
      console.error('Failed to import NotificationSettings', e);
      throw e;
    }
  });

  it('should import ProspectorMaterials', async () => {
    try {
      await import('../src/components/ProspectorMaterials');
      console.log('ProspectorMaterials imported');
    } catch (e) {
      console.error('Failed to import ProspectorMaterials', e);
      throw e;
    }
  });

   it('should import QuickActionsBar', async () => {
    try {
      await import('../src/components/prospector/QuickActionsBar');
      console.log('QuickActionsBar imported');
    } catch (e) {
      console.error('Failed to import QuickActionsBar', e);
      throw e;
    }
  });
});
