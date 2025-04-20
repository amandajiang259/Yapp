import { useState } from 'react';

const EMOJI_CATEGORIES = [
  { name: 'Smileys & People', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'] },
  { name: 'Animals & Nature', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'] },
  { name: 'Food & Drink', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒'] },
  { name: 'Activities', emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸'] },
  { name: 'Travel & Places', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐'] },
  { name: 'Objects', emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹'] },
  { name: 'Symbols', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔'] },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onSelect }: EmojiPickerProps) => {
  const [selectedCategory, setSelectedCategory] = useState(0);

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-2 w-64">
      <div className="flex gap-1 mb-2 overflow-x-auto">
        {EMOJI_CATEGORIES.map((category, index) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(index)}
            className={`px-2 py-1 rounded text-sm ${
              selectedCategory === index
                ? 'bg-[#6c5ce7] text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {category.emojis[0]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="text-xl hover:bg-gray-100 rounded p-1"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}; 