import { useRef } from 'react';
import { IconPencil } from './icons';

/**
 * Avatar circular clicable. Muestra foto o inicial sobre fondo de color.
 * Al hacer click abre selector de archivo, comprime a max 300px y devuelve base64.
 */
export default function PhotoUpload({ value, onChange, size = 60, initials = '?', color = '#64748b' }) {
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative rounded-full overflow-hidden flex-shrink-0 grid place-items-center cursor-pointer group"
        style={{ width: size, height: size, background: value ? undefined : color }}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-semibold select-none" style={{ fontSize: size * 0.35 }}>
            {initials}
          </span>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
          <IconPencil size={Math.round(size * 0.28)} />
          <span className="sr-only">Cambiar foto</span>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] text-text-2">{value ? 'Foto cargada' : 'Sin foto'}</span>
        {value ? (
          <button type="button" onClick={() => onChange(null)} className="text-xs text-negative hover:opacity-80 text-left">
            Quitar foto
          </button>
        ) : (
          <span className="text-xs text-text-3">Toca para subir</span>
        )}
      </div>
    </div>
  );
}
