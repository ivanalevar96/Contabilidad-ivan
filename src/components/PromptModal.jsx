import { useEffect, useState } from 'react';
import Modal from './Modal';

const YM_RX = /^\d{4}-(0[1-9]|1[0-2])$/;

export default function PromptModal({
  open, onClose, title, description,
  defaultValue = '', validate, onConfirm,
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setValue(defaultValue); setError(''); }
  }, [open, defaultValue]);

  const handleConfirm = () => {
    const v = value.trim();
    if (!YM_RX.test(v)) {
      setError('Formato inválido. Usa YYYY-MM, ej. 2026-05.');
      return;
    }
    const err = validate?.(v);
    if (err) { setError(err); return; }
    onConfirm(v);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-5 space-y-4">
        {description && (
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{description}</p>
        )}
        <div>
          <input
            type="month"
            className="input"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
          />
          {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleConfirm}>Confirmar</button>
        </div>
      </div>
    </Modal>
  );
}
