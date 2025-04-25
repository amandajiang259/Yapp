"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../authentication/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import { User } from 'firebase/auth';
import Link from 'next/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot, $getSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import { $convertFromMarkdownString } from '@lexical/markdown';
import ToolbarPlugin from './ToolbarPlugin';
import './editor.css';
import ImageUploader from "@/components/retreiveImage";
import { $generateHtmlFromNodes } from '@lexical/html';

const INTERESTS = [
  "Art", "Music", "Sports", "Technology", "Food", "Travel",
  "Fashion", "Health", "Education", "Business", "Science",
  "Entertainment", "Politics", "Environment", "Literature"
];

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    code: 'editor-text-code',
  },
};

const initialConfig = {
  namespace: 'MyEditor',
  theme,
  onError(error: Error) {
    throw error;
  },
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode
  ]
};

function EditorContent() {
  const [editor] = useLexicalComposerContext();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUserData({
            id: userDoc.id,
            ...userDoc.data()
          });
        }
      }
    };
    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserData) return;

    setIsLoading(true);
    setError(null);

    try {
      const editorState = editor.getEditorState();
      
      // Get the content
      const content = editorState.read(() => {
        return $getRoot().getTextContent();
      });

      // Ensure all required fields are present
      const postData = {
        content: content,
        tags: selectedTags || [],
        userId: currentUserData.id || auth.currentUser?.uid,
        username: currentUserData.username || 'Anonymous',
        firstName: currentUserData.firstName || 'User',
        lastName: currentUserData.lastName || '',
        createdAt: serverTimestamp(),
        type: 'story'
      };

      await addDoc(collection(db, 'posts'), postData);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleEditorChange = (editorState: any) => {
    editorState.read(() => {
      const root = $getRoot();
      const selection = $getSelection();
      const newContent = root.getTextContent();
      if (newContent !== content) {
        setContent(newContent);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f6ebff] flex flex-col">
      {/* Navigation */}
      <nav className="bg-[#6c5ce7] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link 
                href="/dashboard" 
                className="text-xl font-bold text-white hover:text-[#f6ebff] transition-colors cursor-pointer"
              >
                Yapp
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </Link>
                <Link href="/dashboard/search" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Search
                </Link>
                <Link href="/dashboard/messages" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Messages
                </Link>
                <Link href="/dashboard/affirmations" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Affirmations
                </Link>
                <Link href="/dashboard/profile" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">Welcome, {currentUserData?.firstName || 'User'}</span>
              <button
                onClick={() => auth.signOut()}
                className="px-4 py-2 bg-[#68baa5] text-white rounded-md hover:bg-[#5aa594] transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-2xl font-bold text-[#6c5ce7] mb-6 text-center">Create Story</h1>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="story" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Story
                  </label>
                  <div className="bg-white rounded-lg border border-gray-300">
                    <div className="editor-container relative">
                      <div onClick={(e) => e.preventDefault()}>
                        <ToolbarPlugin />
                      </div>
                      <div className="relative">
                        <RichTextPlugin
                          contentEditable={<ContentEditable className="editor-input min-h-[200px] pt-16 px-4" />}
                          placeholder={<div className="absolute top-[15px] left-[11px] text-gray-400 pointer-events-none">Start writing your story...</div>}
                          ErrorBoundary={() => <div>Something went wrong.</div>}
                        />
                        <AutoFocusPlugin />
                        <HistoryPlugin />
                        <LinkPlugin />
                        <ListPlugin />
                        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                  <ImageUploader userId={user?.uid} tags={selectedTags} />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (Select up to 3)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagClick(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-[#6c5ce7] text-white'
                            : 'bg-[#f6ebff] text-[#6c5ce7] border border-[#ab9dd3] hover:bg-[#e6d9ff]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedTags.length}/3 tags selected
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#6c5ce7] text-white px-6 py-2 rounded-lg hover:bg-[#5a4bc7] transition-colors font-medium disabled:opacity-50"
                  >
                    {isLoading ? 'Posting...' : 'Post Story'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Bottom banner */}
        <div className="bg-[#6c5ce7] text-white p-4 text-center shadow-lg">
          <p>Welcome to Yapp! Share your positive affirmations and creative stories!</p>
        </div>
      </div>
    </div>
  );
}

export default function CreatePost() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorContent />
    </LexicalComposer>
  );
} 