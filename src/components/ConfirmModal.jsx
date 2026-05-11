import Modal from './Modal';

export default function ConfirmModal({
  open, onClose, title, message,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  onConfirm, danger = false, hideCancel = false,
}) {
  return (
    <Modal open={open} onClose={hideCancel ? undefined : onClose} title={title} size="sm">
      <div className="p-5">
        {message && (
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{message}</p>
        )}
        <div className="flex justify-end gap-2 mt-5">
          {!hideCancel && (
            <button className="btn-ghost" onClick={onClose}>{cancelLabel}</button>
          )}
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={() => { onConfirm?.(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
