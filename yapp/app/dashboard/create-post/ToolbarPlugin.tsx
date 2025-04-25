import { useCallback, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  TextFormatType,
} from 'lexical';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { EmojiPicker } from './EmojiPicker';

const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const formatText = useCallback(
    (format: TextFormatType) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
        }
      });
    },
    [editor]
  );

  const insertEmoji = useCallback(
    (emoji: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(emoji);
        }
      });
    },
    [editor]
  );

  return (
    <div className="toolbar border-b border-gray-300 p-2 flex flex-wrap gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => formatText('bold')}
          className="px-2 py-1 rounded hover:bg-gray-100"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => formatText('italic')}
          className="px-2 py-1 rounded hover:bg-gray-100"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => formatText('underline')}
          className="px-2 py-1 rounded hover:bg-gray-100"
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          onClick={() => formatText('strikethrough')}
          className="px-2 py-1 rounded hover:bg-gray-100"
          title="Strikethrough"
        >
          <s>S</s>
        </button>
      </div>

      <div className="border-l border-gray-300 mx-2"></div>

      <div className="flex gap-2">
        <button
          onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          className="px-2 py-1 rounded hover:bg-gray-100"
          title="Ordered List"
        >
          1.
        </button>
        <button
          onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          className="px-2 py-1 rounded hover:bg-gray-100"
          title="Bullet List"
        >
          •
        </button>
      </div>

      <div className="border-l border-gray-300 mx-2"></div>

      <div>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="px-2 py-1 rounded hover:bg-gray-100"
          title="Emoji"
        >
          😊
        </button>
        {showEmojiPicker && (
          <div className="absolute z-10 mt-2">
            <EmojiPicker onSelect={insertEmoji} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolbarPlugin; 