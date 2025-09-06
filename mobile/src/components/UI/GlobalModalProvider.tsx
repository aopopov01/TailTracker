import React, { useState, useEffect } from 'react';
import { modalService } from '../../services/modalService';
import type { ModalConfig } from '../../services/modalService';
import { TailTrackerModal } from './TailTrackerModal';

export const GlobalModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    actions: [],
    showCloseButton: false
  });

  useEffect(() => {
    const handleShow = (config: ModalConfig) => {
      setModalConfig(config);
    };

    const handleHide = () => {
      setModalConfig(prev => ({ ...prev, visible: false }));
    };

    modalService.on('show', handleShow);
    modalService.on('hide', handleHide);

    return () => {
      modalService.off('show', handleShow);
      modalService.off('hide', handleHide);
    };
  }, []);

  const handleClose = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
    // Execute the first action's onPress if it exists (usually the primary/OK button)
    if (modalConfig.actions?.[0]?.onPress) {
      modalConfig.actions[0].onPress();
    }
  };

  return (
    <>
      {children}
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={handleClose}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon as any}
        showCloseButton={modalConfig.showCloseButton}
      />
    </>
  );
};