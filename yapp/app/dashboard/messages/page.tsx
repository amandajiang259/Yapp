"use client";

import { useEffect, useState, useRef } from 'react';
import { auth, db } from '../../authentication/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: any;
  senderName: string;
  senderPhotoURL: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  otherUser: {
    id: string;
    username: string;
    photoURL: string;
  };
}

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  photoURL: string;
}

export default function Messages() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/');
      } else {
        setCurrentUser(user);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch conversations
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessage.createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData: Conversation[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
        
        // Fetch other user's data
        const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', otherUserId)));
        const otherUserData = userDoc.docs[0]?.data() || { username: 'Unknown', photoURL: '/default-avatar.svg' };

        conversationsData.push({
          id: doc.id,
          participants: data.participants,
          lastMessage: data.lastMessage,
          otherUser: {
            id: otherUserId,
            username: otherUserData.username,
            photoURL: otherUserData.photoURL || '/default-avatar.svg'
          }
        });
      }

      setConversations(conversationsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    // Fetch messages for selected conversation
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', selectedConversation.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedConversation, currentUser]);

  const fetchUsers = async () => {
    if (!currentUser) return;
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('id', '!=', currentUser.uid));
    const querySnapshot = await getDocs(q);
    const usersData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
    setUsers(usersData);
  };

  const startNewConversation = async (selectedUser: User) => {
    if (!currentUser) return;

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        conv.participants.includes(selectedUser.id)
      );

      if (existingConversation) {
        setSelectedConversation(existingConversation);
        setShowNewConversationModal(false);
        return;
      }

      // Create new conversation
      const conversationsRef = collection(db, 'conversations');
      const newConversation = await addDoc(conversationsRef, {
        participants: [currentUser.uid, selectedUser.id],
        lastMessage: {
          id: 'initial',
          text: 'Conversation started',
          createdAt: serverTimestamp(),
          senderId: currentUser.uid,
          receiverId: selectedUser.id,
          senderName: currentUser.displayName,
          senderPhotoURL: currentUser.photoURL
        }
      });

      // Create the conversation object
      const conversation: Conversation = {
        id: newConversation.id,
        participants: [currentUser.uid, selectedUser.id],
        lastMessage: {
          id: 'initial',
          text: 'Conversation started',
          createdAt: serverTimestamp(),
          senderId: currentUser.uid,
          receiverId: selectedUser.id,
          senderName: currentUser.displayName,
          senderPhotoURL: currentUser.photoURL
        },
        otherUser: {
          id: selectedUser.id,
          username: selectedUser.username,
          photoURL: selectedUser.photoURL || '/default-avatar.svg'
        }
      };

      setSelectedConversation(conversation);
      setShowNewConversationModal(false);
    } catch (error) {
      console.error('Error starting new conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        receiverId: selectedConversation.otherUser.id,
        conversationId: selectedConversation.id,
        createdAt: serverTimestamp(),
        senderName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL
      });

      // Update conversation's last message
      const conversationsRef = collection(db, 'conversations');
      const conversationDoc = doc(db, 'conversations', selectedConversation.id);
      await updateDoc(conversationDoc, {
        lastMessage: {
          text: newMessage,
          createdAt: serverTimestamp(),
          senderId: currentUser.uid
        }
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6ebff] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c5ce7]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6ebff]">
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
                <Link href="/dashboard/profile" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">Welcome, {currentUser.displayName}</span>
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

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex h-[calc(100vh-12rem)]">
            {/* Conversations list */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#6c5ce7]">Messages</h2>
                <button
                  onClick={() => {
                    setShowNewConversationModal(true);
                    fetchUsers();
                  }}
                  className="px-3 py-1 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4dc7] transition-colors text-sm"
                >
                  New Conversation
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.id === conversation.id ? 'bg-[#f6ebff]' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-10">
                        <Image
                          src={conversation.otherUser.photoURL}
                          alt={`${conversation.otherUser.username}'s profile picture`}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#6c5ce7]">
                          {conversation.otherUser.username}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage?.text || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-10">
                        <Image
                          src={selectedConversation.otherUser.photoURL}
                          alt={`${selectedConversation.otherUser.username}'s profile picture`}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <h3 className="font-semibold text-[#6c5ce7]">
                        {selectedConversation.otherUser.username}
                      </h3>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === currentUser.uid
                              ? 'bg-[#6c5ce7] text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(message.createdAt?.toDate()).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#6c5ce7] text-white rounded-lg hover:bg-[#5a4dc7] transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#6c5ce7]">Start New Conversation</h2>
              <button
                onClick={() => setShowNewConversationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {users
                .filter(user => 
                  user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(user => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => startNewConversation(user)}
                  >
                    <div className="relative w-10 h-10">
                      <Image
                        src={user.photoURL || '/default-avatar.svg'}
                        alt={`${user.firstName} ${user.lastName}'s profile picture`}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#6c5ce7]">{user.username}</h3>
                      <p className="text-sm text-gray-500">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#6c5ce7] text-white p-4 text-center shadow-lg">
        <p>Welcome to Yapp! Share your positive affirmations and creative stories!</p>
      </div>
    </div>
  );
} 