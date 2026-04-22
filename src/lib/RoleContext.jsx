import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

const ROLES = {
  lecteur: { label: 'LECTEUR', icon: '📖', badge: '✦ LECTEUR', desc: 'Acheter un livre depuis l\'étranger' },
  voyageur: { label: 'VOYAGEUR', icon: '✈️', badge: '✈ VOYAGEUR', desc: 'Transporter & gagner des commissions' },
  relais: { label: 'RELAIS', icon: '🏪', badge: '🏪 RELAIS', desc: 'Gérer le stock & les dépôts' },
};

export function RoleProvider({ children }) {
  const [role, setRole] = useState('lecteur');
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <RoleContext.Provider value={{ role, setRole, switcherOpen, setSwitcherOpen, ROLES }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}