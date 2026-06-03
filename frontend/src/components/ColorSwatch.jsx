export default function ColorSwatch({ colors, selected, onSelect }) {
  return (
    <div className="flex items-center space-x-2">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelect && onSelect(color)}
          className={`w-6 h-6 rounded-full border-2 ${selected === color ? 'border-primary' : 'border-gray-300'} `}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
