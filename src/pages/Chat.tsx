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
    // Only proceed if auth context is not loading, user object is available, and user.id is defined
    if (authLoading || !user || !user.id) {
      console.log('useEffect returning early', { authLoading, user });
      setIsLoading(false); // Stop loading if auth is still loading or user is null/id is undefined
      return;
    }

    // Initialize socket connection
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
      console.log('Auth token not found in storage during socket init');
      toast.error('Authentication token not found. Please log in again.');
      setIsLoading(false); // Stop loading if token is missing
      return;
    }
    console.log('Auth token found in storage for socket init', token);

    // Disconnect existing socket if it exists before creating a new one
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
      setSocket(null); // Set socket to null on connection error
    });

    newSocket.on('receive', (message: Message) => {
      console.log('Received message:', message);
      // Only add message if it belongs to the currently selected chat
      if (selectedChat && ((message.senderId === selectedChat && message.receiverId === user.id) || (message.receiverId === selectedChat && message.senderId === user.id))) {
         setMessages(prev => [...prev, message]);
      } else if (user && (message.senderId === user.id || message.receiverId === user.id)) {
          // This message is for the current user but not the selected chat.
          // Potentially update chat list preview here if needed for the relevant chat.
          console.log('Received message for current user, but not selected chat.', message);
          // Find the chat in the current chats list and update its last message preview if necessary
           setChats(prevChats => {
             const chatIndex = prevChats.findIndex(chat => chat.userId === message.senderId || chat.userId === message.receiverId);
              if (chatIndex > -1) {
                const updatedChats = [...prevChats];
                const chatToUpdate = { ...updatedChats[chatIndex] };
                chatToUpdate.messages = [...chatToUpdate.messages, message]; // Add the new message
                 // Sort chats to bring the one with the new message to the top (optional but common)
                 updatedChats.sort((a, b) => {
                     const lastMsgA = a.messages[a.messages.length - 1]?.sent_at;
                     const lastMsgB = b.messages[b.messages.length - 1]?.sent_at;
                     if (!lastMsgA) return 1;
                     if (!lastMsgB) return -1;
                     return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
                 });
                 return updatedChats;
               } else {
                // This might be a new chat initiated by someone else. Refetch chats or add a placeholder.
                // For simplicity now, we just log, but a refetch might be needed.
                console.log('Received message for a chat not currently in the list.');
                 // Consider a small delay and then refetchChats(user.id);
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

    // Fetch existing chats
    fetchChats(user.id);

    // Clean up socket connection on component unmount or user change
    return () => {
      console.log('Disconnecting socket');
      if (newSocket.connected) {
          newSocket.disconnect();
      }
    };
  }, [user, authLoading, selectedChat]); // Depend on user, authLoading, and selectedChat

  // Add useEffect to handle selectedChat changes and load messages and user details
  useEffect(() => {
    if (selectedChat && user) {
      console.log(`Attempting to load messages and user details for chat with user: ${selectedChat}`);
      // Find the chat in the existing chats list
       const currentChat = chats.find(chat => chat.userId === selectedChat);
       if(currentChat) {
         console.log('Found existing chat, setting messages and user details');
         setMessages(currentChat.messages);
          // Set the selected chat user details from the existing chat
          setSelectedChatUser({ userId: currentChat.userId, username: currentChat.username }); // Assuming username is available in chats
       } else {
         // Handle case where selected chat might be a new one (from search) or not in the initial chats list
         console.log('Conversation not found in existing list, attempting to find in search results or fetch user details');
         setMessages([]); // Start with empty messages for a potentially new chat

          // Try to find user details from search results if available
          const searchedUser = searchResults.find(u => u._id === selectedChat);
          if (searchedUser) {
              console.log('Found user in search results, setting user details', searchedUser);
              setSelectedChatUser({ userId: searchedUser._id, username: searchedUser.username, profilePhoto: searchedUser.profilePhoto });
          } else {
              // TODO: Fetch user details for the selectedChat user if not found in search results
              console.log(`User details not in search results, need to fetch for user ID: ${selectedChat}`);
               setSelectedChatUser(null); // Clear previous user details
              // A new fetch call here to get user details by ID would be necessary
              /*
              const fetchUserDetails = async (userId: string) => {
                 try {
                    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
                     if (!token) return;
                    const response = await fetch(`http://localhost:3001/users/${userId}`, {
                     headers: {
                         'Authorization': `Bearer ${token}`
                      }
                    });
                     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const userData = await response.json();
                    setSelectedChatUser({ userId: userData._id, username: userData.username, profilePhoto: userData.profilePhoto });
                 } catch (error) {
                    console.error('Error fetching user details:', error);
                    toast.error('Failed to load user details');
                 }
              };
              fetchUserDetails(selectedChat);
              */
          }
       }
    }
     // Clear messages and selected user when no chat is selected
    if (!selectedChat) {
      console.log('No chat selected, clearing messages and selected user');
      setMessages([]);
      setSelectedChatUser(null);
    }
  }, [selectedChat, chats, user, searchResults]); // Depend on selectedChat, chats, user, and searchResults

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
      setChats(Array.isArray(data) ? data : []); // Ensure data is an array
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
      console.log('Auth token for handleSearch:', token); // Log the token here
      if (!token) { // Check for token here too
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
      setSearchResults(Array.isArray(data) ? data : []); // Ensure search results are an array
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
    // Set the selectedChat to the ID of the user clicked from search results
    setSelectedChat(userResult._id); // Use the user's ID as the selectedChat identifier for new chats
    // Set the selected chat user details directly from the search result
    setSelectedChatUser({ userId: userResult._id, username: userResult.username, profilePhoto: userResult.profilePhoto });
    setMessages([]); // Clear messages for a new chat
    setSearchResults([]); // Clear search results after selecting a user
    setSearchTerm(''); // Clear search term
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !user || !selectedChatUser) return;

    const messagePayload = {
      senderId: user.id,
      receiverId: selectedChatUser.userId, // Use the userId from selectedChatUser
      message: newMessage.trim(), // Use 'message' property
    };

    console.log('Attempting to send message:', messagePayload);
    socket.emit('send', messagePayload);
    setNewMessage('');

    // Optimistically add the sent message to the current chat view
    setMessages(prev => [...prev, { ...messagePayload, id: 'temp-' + Date.now(), sent_at: new Date().toISOString() }]);

    // Also update the chats list preview with the sent message
    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(chat => chat.userId === selectedChatUser.userId);
      if (chatIndex > -1) {
        // Update existing chat
        const updatedChats = [...prevChats];
        const chatToUpdate = { ...updatedChats[chatIndex] };
        chatToUpdate.messages = [...chatToUpdate.messages, { ...messagePayload, id: 'temp-' + Date.now(), sent_at: new Date().toISOString() }];
        // Sort chats to bring the one with the new message to the top
        updatedChats.sort((a, b) => {
            const lastMsgA = a.messages[a.messages.length - 1]?.sent_at;
            const lastMsgB = b.messages[b.messages.length - 1]?.sent_at;
            if (!lastMsgA) return 1;
            if (!lastMsgB) return -1;
            return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
        });
        return updatedChats;
      } else {
        // This is a new chat, add a new entry to the chats list
        const newChatEntry: Conversation = {
          userId: selectedChatUser.userId,
          username: selectedChatUser.username,
          messages: [{ ...messagePayload, id: 'temp-' + Date.now(), sent_at: new Date().toISOString() }],
        };
         // Add the new chat to the top and sort
        const updatedChats = [newChatEntry, ...prevChats];
         updatedChats.sort((a, b) => {
            const lastMsgA = a.messages[a.messages.length - 1]?.sent_at;
            const lastMsgB = b.messages[b.messages.length - 1]?.sent_at;
            if (!lastMsgA) return 1;
            if (!lastMsgB) return -1;
            return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
        });
        return updatedChats;
      }
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Conversation List Sidebar */}
      <div className="w-1/4 border-r border-gray-200 p-4 flex flex-col h-full overflow-hidden">
        <h2 className="text-xl font-semibold mb-4">Conversations</h2>
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {isSearching ? (
          <div className="flex justify-center items-center h-16">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2 mb-4 overflow-y-auto">
            <div className="mt-2 border-t border-gray-200 pt-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              <p className="px-4 text-xs font-semibold text-gray-500">Search Results</p>
              <ul>
                {searchResults.map(user => (
                  <li
                    key={user._id}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => startNewChat(user)}
                  >
                    <UserIcon className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{user.username}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {/* Conversation List */}
        {!searchTerm && (
          isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No conversations yet. Search for a user to start one.
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
              {chats.map((chat) => (
                <div
                  key={chat.userId}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${selectedChat === chat.userId ? 'bg-purple-100' : ''}`}
                  onClick={() => setSelectedChat(chat.userId)}
                >
                  <div className="font-medium">{chat.username}</div>
                  <div className="text-sm text-gray-500">
                    {chat.messages[chat.messages.length - 1]?.message || 'No messages yet'}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedChatUser ? (
          <>
            {/* Conversation Header */}
            <div className="border-b border-gray-200 p-4 text-lg font-semibold flex items-center gap-3">
              {selectedChatUser.profilePhoto ? (
                <img src={selectedChatUser.profilePhoto} alt={selectedChatUser.username} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <UserIcon className="h-10 w-10 text-gray-500" />
              )}
              {selectedChatUser.username}
            </div>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${message.senderId === user?.id ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${message.senderId === user?.id ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
                  >
                    {message.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.sent_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input - Only show if we have a selected chat user */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation or search for a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}