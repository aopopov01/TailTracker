// Modal service for managing modal states globally
import React from 'react';
import { Subject } from 'rxjs';

export interface ModalConfig {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  onClose?: () => void;
}

class ModalService {
  private modals = new Map<string, ModalConfig>();
  private modalSubject = new Subject<{
    action: 'open' | 'close';
    modal: ModalConfig | string;
  }>();

  public modalUpdates$ = this.modalSubject.asObservable();

  openModal(config: ModalConfig) {
    this.modals.set(config.id, config);
    this.modalSubject.next({ action: 'open', modal: config });
  }

  closeModal(id: string) {
    const modal = this.modals.get(id);
    if (modal) {
      this.modals.delete(id);
      this.modalSubject.next({ action: 'close', modal: id });

      // Call onClose callback if provided
      if (modal.onClose) {
        modal.onClose();
      }
    }
  }

  closeAllModals() {
    const modalIds = Array.from(this.modals.keys());
    modalIds.forEach(id => this.closeModal(id));
  }

  getModal(id: string): ModalConfig | undefined {
    return this.modals.get(id);
  }

  isModalOpen(id: string): boolean {
    return this.modals.has(id);
  }

  getOpenModals(): ModalConfig[] {
    return Array.from(this.modals.values());
  }
}

export const modalService = new ModalService();
export default modalService;
