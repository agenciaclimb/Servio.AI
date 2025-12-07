import React, { useState } from 'react';
import CollapsibleSidebar from './CollapsibleSidebar';
import QuickPanel from '../src/components/prospector/QuickPanel';
import ProspectorCRMProfessional from '../src/components/prospector/ProspectorCRMProfessional';
import ReferralLinkGenerator from '../src/components/ReferralLinkGenerator';
import ProspectorMaterials from '../src/components/ProspectorMaterials';
import ProspectorStatistics from './ProspectorStatistics'; // Importando o novo componente

type NavItem = 'dashboard' | 'crm' | 'links' | 'materials' | 'overview';

interface ProspectorLayoutProps {
  userId: string;
}

const ProspectorLayout: React.FC<ProspectorLayoutProps> = ({ userId }) => {
  const [activeView, setActiveView] = useState<NavItem>('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <QuickPanel prospectorId={userId} />;
      case 'crm':
        return <ProspectorCRMProfessional prospectorId={userId} />;
      case 'links':
        return <ReferralLinkGenerator prospectorId={userId} onLinkGenerated={() => {}} />;
      case 'materials':
        return <ProspectorMaterials />;
      case 'overview':
        return <ProspectorStatistics prospectorId={userId} />;
      default:
        return <QuickPanel prospectorId={userId} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <CollapsibleSidebar activeItem={activeView} onItemClick={setActiveView} />
      <main className="flex-1 overflow-y-auto p-8">{renderContent()}</main>
    </div>
  );
};

export default ProspectorLayout;
