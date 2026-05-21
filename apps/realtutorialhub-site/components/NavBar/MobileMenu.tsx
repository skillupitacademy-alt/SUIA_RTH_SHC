import React from 'react';
import { NavItem } from '@/lib/NavBarData';
import ContactButtons from './ContactButtons';

interface MobileMenuProps {
  isOpen: boolean;
  navItems: NavItem[];
  activeSection: string;
  onNavItemClick: (sectionId: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  navItems,
  activeSection,
  onNavItemClick
}) => {
  return (
    <div
      className={`xl:hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
        {navItems.map((item) => (
          <MobileNavButton
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onClick={() => onNavItemClick(item.id)}
          />
        ))}
        <div className="border-t border-gray-200 pt-3 mt-2">
          <ContactButtons variant="mobile" />
        </div>
      </div>
    </div>
  );
};

interface MobileNavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const MobileNavButton: React.FC<MobileNavButtonProps> = ({ item, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-3 text-base font-medium rounded-md transition-colors ${
        isActive
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
      }`}
      aria-label={`Navigate to ${item.name}`}
    >
      {item.name}
      {isActive && (
        <span className="ml-2 inline-block w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
      )}
    </button>
  );
};

export default MobileMenu;