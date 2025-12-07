
import React, { useState } from 'react';
import { HomeIcon, UsersIcon, LinkIcon, DocumentTextIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Tooltip from './Tooltip'; // Assuming a Tooltip component exists

type NavItem = 'dashboard' | 'crm' | 'links' | 'materials' | 'overview';

interface CollapsibleSidebarProps {
  activeItem: NavItem;
  onItemClick: (item: NavItem) => void;
}

const navItems = [
  { id: 'dashboard', icon: HomeIcon, label: 'Dashboard IA' },
  { id: 'crm', icon: UsersIcon, label: 'Pipeline CRM' },
  { id: 'links', icon: LinkIcon, label: 'Links de Convite' },
  { id: 'materials', icon: DocumentTextIcon, label: 'Materiais de Prospecção' },
  { id: 'overview', icon: ChartBarIcon, label: 'Estatísticas Detalhadas' },
];

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ activeItem, onItemClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-width duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && <span className="font-bold text-indigo-600">Servio.AI</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isCollapsed ? <ChevronRightIcon className="h-6 w-6" /> : <ChevronLeftIcon className="h-6 w-6" />}
        </button>
      </div>
      <nav className="flex-grow mt-4">
        {navItems.map(({ id, icon: Icon, label }) => (
          <Tooltip content={label} position="right">
            <a
              href="#"
              key={id}
              onClick={(e) => {
                e.preventDefault();
                onItemClick(id as NavItem);
              }}
              className={`flex items-center px-4 py-3 my-1 text-gray-700 transition-colors duration-200 ease-in-out hover:bg-indigo-50 ${activeItem === id ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-500' : ''}`}>
              <Icon className="h-6 w-6" />
              {!isCollapsed && <span className="ml-4 font-medium">{label}</span>}
            </a>
          </Tooltip>
        ))}
      </nav>
    </div>
  );
};

export default CollapsibleSidebar;
