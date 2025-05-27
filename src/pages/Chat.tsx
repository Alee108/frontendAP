import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { io, Socket } from 'socket.io-client';
import { Message } from "../types/chat";
import { Conversation } from "../types/chat";
import { toast } from 'sonner';
import { Search as SearchIcon, User as UserIcon } from 'lucide-react';

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<{
    userId: string;
    username: string;
    profilePhoto?: string;
  } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [chats, setChats] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    console.log('useEffect running, authLoading:', authLoading, 'user:', user);
    if (authLoading || !user || !user.id) {
      console.log('useEffect returning early', { authLoading, user });
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
      console.log('Auth token not found in storage during socket init');
      toast.error('Authentication token not found. Please log in again.');
      setIsLoading(false);
      return;
    }
    console.log('Auth token found in storage for socket init', token);

    if (socket) {
        socket.disconnect();
    }

    const newSocket = io('http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      toast.success('Connected to chat server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to chat server');
      setSocket(null);
    });

    newSocket.on('receive', (message: Message) => {
      console.log('Received message:', message);
      if (selectedChat && ((message.senderId === selectedChat && message.receiverId === user.id) || (message.receiverId === selectedChat && message.senderId === user.id))) {
         setMessages(prev => [...prev, message]);
      } else if (user && (message.senderId === user.id || message.receiverId === user.id)) {
          console.log('Received message for current user, but not selected chat.', message);
           setChats(prevChats => {
             const chatIndex = prevChats.findIndex(chat => chat.userId === message.senderId || chat.userId === message.receiverId);
              if (chatIndex > -1) {
                const updatedChats = [...prevChats];
                const chatToUpdate = { ...updatedChats[chatIndex] };
                chatToUpdate.messages = [...chatToUpdate.messages, message];
                 updatedChats.sort((a, b) => {
                     const lastMsgA = a.messages[a.messages.length - 1]?.sent_at;
                     const lastMsgB = b.messages[b.messages.length - 1]?.sent_at;
                     if (!lastMsgA) return 1;
                     if (!lastMsgB) return -1;
                     return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
                 });
                 return updatedChats;
               } else {
                console.log('Received message for a chat not currently in the list.');
                return prevChats;
              }
           });
      }
    });

     newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        toast.warning(`Disconnected from chat server: ${reason}`);
        setSocket(null);
      });

    setSocket(newSocket);

    fetchChats(user.id);

    return () => {
      console.log('Disconnecting socket');
      if (newSocket.connected) {
          newSocket.disconnect();
      }
    };
  }, [user, authLoading, selectedChat]);

  useEffect(() => {
    if (selectedChat && user) {
      console.log(`Loading chat for user: ${selectedChat}`);
      
      // First check if it's an existing chat
      const currentChat = chats.find(chat => chat.userId === selectedChat);
      if (currentChat) {
        console.log('Found existing chat, loading messages');
        setMessages(currentChat.messages);
        setSelectedChatUser({ 
          userId: currentChat.userId, 
          username: currentChat.username,
          profilePhoto: currentChat.profilePhoto 
        });
      } else {
        // It's a new chat from search
        console.log('New chat from search, setting empty messages');
        setMessages([]);
        
        // Check if we already have the user details from search
        const searchedUser = searchResults.find(u => u._id === selectedChat);
        if (searchedUser) {
          console.log('Using user details from search results');
          setSelectedChatUser({ 
            userId: searchedUser._id, 
            username: searchedUser.username, 
            profilePhoto: searchedUser.profilePhoto 
          });
        }
        // If selectedChatUser was already set by startNewChat, it will persist
      }
    } else if (!selectedChat) {
      console.log('No chat selected, clearing state');
      setMessages([]);
      setSelectedChatUser(null);
    }
  }, [selectedChat, chats, user, searchResults]);

  const fetchChats = async (userId: string) => {
    console.log(`Fetching chats for user: ${userId}`);
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      console.log('Auth token for fetchChats:', token);
      if (!token) {
        toast.error('Authentication token not found during fetch');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:3001/chat/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched chats:', data);
      setChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load conversations');
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      console.log('Auth token for handleSearch:', token);
      if (!token) {
         toast.error('Authentication token not found for search');
         setIsSearching(false);
         return;
      }
      const response = await fetch(`http://localhost:3001/users/search?username=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Search results:', data);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const startNewChat = (userResult: { _id: string; username: string; profilePhoto?: string }) => {
    console.log('Attempting to start a new chat with user:', userResult);
    // Set the selected chat ID
    setSelectedChat(userResult._id);
    // IMPORTANT: Set the selected chat user details immediately for new chats
    setSelectedChatUser({ 
      userId: userResult._id, 
      username: userResult.username, 
      profilePhoto: userResult.profilePhoto 
    });
    // Clear messages for a new chat
    setMessages([]);
    // Keep search results visible until a message is sent
    // Don't clear search here - will clear after first message
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !user || !selectedChatUser) return;

    const messagePayload = {
      senderId: user.id,
      receiverId: selectedChatUser.userId,
      message: newMessage.trim(),
    };

    console.log('Attempting to send message:', messagePayload);
    socket.emit('send', messagePayload);
    setNewMessage('');

    // Add the message to the current view
    const tempMessage = { 
      ...messagePayload, 
      id: 'temp-' + Date.now(), 
      sent_at: new Date().toISOString() 
    };
    setMessages(prev => [...prev, tempMessage]);

    // Update or create chat in the conversations list
    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(chat => chat.userId === selectedChatUser.userId);
      if (chatIndex > -1) {
        // Update existing chat
        const updatedChats = [...prevChats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          messages: [...updatedChats[chatIndex].messages, tempMessage]
        };
        // Sort to bring updated chat to top
        return updatedChats.sort((a, b) => {
          const lastMsgA = a.messages[a.messages.length - 1]?.sent_at;
          const lastMsgB = b.messages[b.messages.length - 1]?.sent_at;
          if (!lastMsgA) return 1;
          if (!lastMsgB) return -1;
          return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
        });
      } else {
        // Create new chat entry
        const newChatEntry: Conversation = {
          userId: selectedChatUser.userId,
          username: selectedChatUser.username,
          messages: [tempMessage],
        };
        return [newChatEntry, ...prevChats];
      }
    });

    // Clear search after first message is sent to a new chat
    if (searchResults.length > 0) {
      setSearchResults([]);
      setSearchTerm('');
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Conversation List Sidebar */}
      <div className="w-1/4 min-w-[250px] border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold mb-4">Conversations</h2>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isSearching ? (
            <div className="flex justify-center items-center h-32">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">Search Results</p>
              <ul>
                {searchResults.map(user => (
                  <li
                    key={user._id}
                    className={`flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors ${
                      selectedChat === user._id ? 'bg-purple-100 border-l-4 border-purple-600' : ''
                    }`}
                    onClick={() => startNewChat(user)}
                  >
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt={user.username} className="h-10 w-10 rounded-full object-cover mr-3" />
                    ) : (
                      <UserIcon className="h-10 w-10 mr-3 text-gray-400 bg-gray-200 rounded-full p-2" />
                    )}
                    <span className="text-sm font-medium text-gray-900">{user.username}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            !searchTerm && (
              isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center text-gray-500 p-8">
                  No conversations yet. Search for a user to start one.
                </div>
              ) : (
                <div>
                  {chats.map((chat) => (
                    <div
                      key={chat.userId}
                      className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
                        selectedChat === chat.userId ? 'bg-purple-100 border-l-4 border-purple-600' : ''
                      }`}
                      onClick={() => {
                        setSelectedChat(chat.userId);
                        // Clear search when selecting existing chat
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      <div className="flex items-center">
                        <UserIcon className="h-10 w-10 mr-3 text-gray-400 bg-gray-200 rounded-full p-2" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{chat.username}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {chat.messages[chat.messages.length - 1]?.message || 'No messages yet'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedChatUser ? (
          <>
            {/* Conversation Header */}
            <div className="border-b border-gray-200 p-4 bg-white shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                {selectedChatUser.profilePhoto ? (
                  <img src={selectedChatUser.profilePhoto} alt={selectedChatUser.username} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-10 w-10 text-gray-400 bg-gray-200 rounded-full p-2" />
                )}
                <span className="text-lg font-semibold text-gray-900">{selectedChatUser.username}</span>
              </div>
            </div>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0">
              <div className="flex flex-col space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.senderId === user?.id ? 'order-2' : ''}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.senderId === user?.id 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white text-gray-900 shadow-sm'
                        }`}
                      >
                        <p className="break-words">{message.message}</p>
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${
                        message.senderId === user?.id ? 'text-right' : 'text-left'
                      }`}>
                        {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <UserIcon className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">No conversation selected</p>
            <p className="text-sm text-gray-500 text-center">
              {searchTerm ? 'Select a user from search results to start chatting' : 'Search for a user to start a new conversation'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}