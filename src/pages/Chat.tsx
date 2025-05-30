import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { io, Socket } from 'socket.io-client';
import { apiService, PopulatedUser, ReceivedMessage, SimplifiedMessage, ChatInfo } from "../lib/api";
import { toast } from 'sonner';
import { Search as SearchIcon, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001';

// Funzione helper per formattare la data
const formatMessageTime = (dateString: string) => {
  const messageDate = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

  if (messageDateOnly.getTime() === today.getTime()) {
    // Oggi - mostra solo l'ora
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (messageDateOnly.getTime() === yesterday.getTime()) {
    // Ieri
    return 'Yesterday';
  } else {
    // Altri giorni - mostra la data
    return messageDate.toLocaleDateString([], { 
      day: '2-digit', 
      month: '2-digit', 
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  }
};

export default function Chat() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<SimplifiedMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<PopulatedUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingInitialChats, setIsLoadingInitialChats] = useState(true);
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PopulatedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadChats, setUnreadChats] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref per tenere traccia del selectedChat corrente
  const selectedChatRef = useRef<string | null>(null);
  const userRef = useRef<any>(null);

  // Aggiorna i ref quando cambiano i valori
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Inizializzazione del socket
  useEffect(() => {
    if (user) {
      const token = apiService.verifyToken();
      if (!token) return;

      console.log('Connecting to chat socket...');

      const newSocket = io(API_URL, {
        auth: { 
          token: apiService.verifyToken(),
          type: 'user'
        },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: true,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('Chat socket connected successfully');
        if (user._id) {
          fetchChats(user._id);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Chat socket connection error:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        // Check if the error is an unauthorized error
        if (error.message.includes('Unauthorized') || error.message.includes('unauthorized')) {
          toast.error('Session expired. Please login again.');
          // Clear any existing auth data
          apiService.logout();
          // Redirect to login
          navigate('/login');
          return;
        }
        
        toast.error(`Failed to connect to chat service: ${error.message}`);
      });

      newSocket.on('error', (error) => {
        console.error('Chat socket error:', error);
        toast.error(`Socket error: ${error.message}`);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Chat socket disconnected:', reason);
        
        switch (reason) {
          case 'io server disconnect':
            console.log('Server disconnected, attempting to reconnect...');
            setTimeout(() => {
              newSocket.connect();
            }, 1000);
            break;
          case 'transport close':
            console.log('Connection lost, attempting to reconnect...');
            break;
          case 'transport error':
            console.log('Transport error, attempting to reconnect...');
            break;
          default:
            console.log('Disconnected for reason:', reason);
        }
      });

      newSocket.on('receive', (msg: any) => {
        console.log("Chat socket receive event triggered with message:", msg);
        console.log("Current user:", userRef.current);
        console.log("Current selected chat:", selectedChatRef.current);
        handleReceiveMessage(msg);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket.connected) {
          newSocket.disconnect();
        }
      };
    }
  }, [user, navigate]);

  const fetchChats = useCallback(async (userId: string) => {
    console.log(`Fetching chats for user: ${userId}`);
    try {
      setIsLoadingInitialChats(true);
      const data = (await apiService.getUserConversations(userId)).reverse();

      const validatedChats = Array.isArray(data) ? data.filter(chat => 
        chat && chat.userId && Array.isArray(chat.messages)
      ) : [];
      console.log('Fetched chats validated data:', validatedChats);
      setChats(validatedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load conversations');
      setChats([]);
    } finally {
      setIsLoadingInitialChats(false);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReceiveMessage = (message) => {
    console.log('Processing received message:', message);

    if (!message || !message.sender || !message.receiver || (!message.message && !message.message_text)) {
      console.error('Received invalid message format:', message);
      return;
    }

    const currentUser = userRef.current;
    const currentSelectedChat = selectedChatRef.current;

    if (!currentUser) {
      console.error('No current user found in handleReceiveMessage');
      return;
    }

    const messageForCurrentUser = message.sender._id === currentUser._id || message.receiver._id === currentUser._id;
    if (!messageForCurrentUser) {
      console.log('Message not for current user, ignoring in handleReceiveMessage');
      return;
    }

    const relevantChatId = message.sender._id === currentUser._id ? message.receiver._id : message.sender._id;
    const messageContent = message.message || message.message_text;

    // Se il messaggio è da un altro utente e non siamo nella chat corrente, aggiungiamo l'ID della chat agli unread
    if (message.sender._id !== currentUser._id && relevantChatId !== currentSelectedChat) {
      setUnreadChats(prev => new Set([...prev, relevantChatId]));
    }

    console.log('Updating chats with new message:', {
      relevantChatId,
      messageContent,
      currentSelectedChat
    });

    // Update chats list
    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(chat => chat.userId === relevantChatId);
      let updatedChats = [...prevChats];

      if (chatIndex > -1) {
        const chatToUpdate = { ...updatedChats[chatIndex] };
        
        // Controllo duplicati più preciso
        
        
          console.log('Adding new message to existing chat');
          const newMessage = {
            id: message.id,
            message: messageContent,
            sender: message.sender,
            receiver: message.receiver,
            sent_at: message.sent_at,
            senderId: message.sender._id,
            receiverId: message.receiver._id
          };

          // Se è una conferma del nostro messaggio, sostituisci il messaggio temporaneo
          if (message.sender._id === currentUser._id) {
            const tempMessageIndex = chatToUpdate.messages.findIndex(msg => 
              msg.id.startsWith('temp-') && msg.message === messageContent
            );
            if (tempMessageIndex > -1) {
              chatToUpdate.messages[tempMessageIndex] = newMessage;
            } else {
              chatToUpdate.messages = [...chatToUpdate.messages, newMessage];
            }
          } else {
            chatToUpdate.messages = [...chatToUpdate.messages, newMessage];
          }

          chatToUpdate.lastMessage = {
            text: messageContent,
            sent_at: message.sent_at,
            senderId: message.sender._id
          };
          updatedChats[chatIndex] = chatToUpdate;
          // Sposta la chat aggiornata in cima alla lista
          updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(chatToUpdate);
        
          
      } else {
        console.log('Creating new chat entry for received message');
        const otherUser = message.sender._id === currentUser._id ? message.receiver : message.sender;
        const newChat: ChatInfo = {
          id: `temp-${Date.now()}`,
          participants: [message.sender._id, message.receiver._id],
          userId: otherUser._id,
          username: otherUser.username,
          email: otherUser.email,
          profilePhoto: otherUser.profilePhoto,
          messages: [{
            id: message.id,
            message: messageContent,
            sender: message.sender,
            receiver: message.receiver,
            sent_at: message.sent_at,
            senderId: message.sender._id,
            receiverId: message.receiver._id
          }],
          lastMessage: {
            text: messageContent,
            sent_at: message.sent_at,
            senderId: message.sender._id
          }
        };
        // Aggiungi la nuova chat in cima alla lista
        updatedChats = [newChat, ...updatedChats];
      }

      return updatedChats;
    });

    // Aggiorna i messaggi della chat corrente se è selezionata
    if (currentSelectedChat && relevantChatId === currentSelectedChat) {
      console.log('Updating current chat messages');
      setMessages(prev => {
        const isDuplicate = prev.some(msg => 
          msg.id === message.id || 
          (msg.message === messageContent && 
           msg.senderId === message.sender._id && 
           msg.receiverId === message.receiver._id &&
           Math.abs(new Date(msg.sent_at).getTime() - new Date(message.sent_at).getTime()) < 1000)
        );
        
        if (isDuplicate) {
          console.log('Duplicate message in current chat, skipping');
          return prev;
        }
        
        const newMessage = {
          id: message.id,
          message: messageContent,
          sender: message.sender,
          receiver: message.receiver,
          sent_at: message.sent_at,
          senderId: message.sender._id,
          receiverId: message.receiver._id
        };

        // Se è una conferma del nostro messaggio, sostituisci il messaggio temporaneo
        if (message.sender._id === currentUser._id) {
          const tempMessageIndex = prev.findIndex(msg => 
            msg.id.startsWith('temp-') && msg.message === messageContent
          );
          if (tempMessageIndex > -1) {
            const newMessages = [...prev];
            newMessages[tempMessageIndex] = newMessage;
            return newMessages;
          }
        }

        return [...prev, newMessage];
      });
    }
  };

  useEffect(() => {
    console.log('Selected chat useEffect running:', { selectedChat, user, chats: chats.length });
    if (selectedChat && user?._id) {

      const currentChat = chats.find(chat => chat.userId === selectedChat);

      if (currentChat) {
        const validMessages = Array.isArray(currentChat.messages) 
          ? currentChat.messages.filter(msg => 
              msg && msg.id && msg.message && msg.sender && msg.receiver
            )
          : [];
        setMessages(validMessages);
        
        const otherUser: PopulatedUser = {
          _id: currentChat.userId,
          username: currentChat.username,
          email: currentChat.email,
          profilePhoto: currentChat.profilePhoto
        };
        setSelectedChatUser(otherUser);
      } else {
        setMessages([]);
      }
    } else if (!selectedChat) {
      setMessages([]);
      setSelectedChatUser(null);
    }
  }, [selectedChat, chats, user?._id]);

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await apiService.searchUsers(query);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const startNewChat = (userResult: PopulatedUser) => {
    const existingChat = chats.find(chat => 
      chat.userId === userResult._id
    );

    if (existingChat) {
      setSelectedChat(existingChat.userId);
      const otherUser = { 
        _id: existingChat.userId, 
        username: existingChat.username, 
        email: existingChat.email, 
        profilePhoto: existingChat.profilePhoto 
      } as PopulatedUser;
      setSelectedChatUser(otherUser);
    } else {
      setSelectedChat(userResult._id);
      setSelectedChatUser(userResult);
      setMessages([]);
    }

    setSearchTerm('');
    setSearchResults([]);
  };

  const sendMessage = () => {    if (!newMessage.trim() || !socket || !user?._id || !selectedChatUser?._id) {      return;
    }

    const conversationId = chats.find(chat => chat.userId === selectedChat)?.userId || selectedChat;
    const messageData = {
      sender: user._id, 
      receiver: selectedChatUser._id,
      message_text: newMessage.trim(),
      conversationId: conversationId !== selectedChatUser._id ? conversationId : undefined
    };

    const tempMessageId = 'temp-' + Date.now();    
    // Add error handling for socket emit
    socket.emit('send', messageData, (error: Error | null) => {
      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message. Please try again.');
        // Rimuovi il messaggio temporaneo se l'invio fallisce
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        setChats(prevChats => {
          const chatIndex = prevChats.findIndex(chat => chat.userId === selectedChat);
          if (chatIndex > -1) {
            const updatedChats = [...prevChats];
            const chatToUpdate = { ...updatedChats[chatIndex] };
            chatToUpdate.messages = chatToUpdate.messages.filter(msg => msg.id !== tempMessageId);
            updatedChats[chatIndex] = chatToUpdate;
            return updatedChats;
          }
          return prevChats;
        });
      }
    });

    setNewMessage('');

    const tempMessage: SimplifiedMessage = {
      id: tempMessageId,
      message: messageData.message_text,
      sender: user, 
      receiver: selectedChatUser,
      sent_at: new Date().toISOString(), 
      senderId: user._id,
      receiverId: selectedChatUser._id
    };
    setMessages(prev => [
      ...prev,
      tempMessage
    ]);

    setChats(prevChats => {      const chatIndex = prevChats.findIndex(chat => chat.userId === selectedChat);
      let updatedChats = [...prevChats];

      if (chatIndex > -1) {        const chatToUpdate: ChatInfo = {
          ...updatedChats[chatIndex],
          messages: [...updatedChats[chatIndex].messages, tempMessage],
          lastMessage: {
            text: tempMessage.message,
            sent_at: tempMessage.sent_at,
            senderId: tempMessage.senderId
          }
        };
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(chatToUpdate);
      } else {
        console.warn('Sending message to a user without an existing chat entry in chats list. Creating new temporary chat entry.');
        if (selectedChatUser && user) {
          const newChat: ChatInfo = {
            id: `temp-${Date.now()}`,
            participants: [user._id, selectedChatUser._id],
            userId: selectedChatUser._id,
            username: selectedChatUser.username,
            email: selectedChatUser.email,
            profilePhoto: selectedChatUser.profilePhoto,
            messages: [tempMessage],
            lastMessage: {
              text: tempMessage.message,
              sent_at: tempMessage.sent_at,
              senderId: tempMessage.senderId
            }
          };
          updatedChats.unshift(newChat);
        }
      }
      console.log('New chats state after optimistic update:', updatedChats);
      return updatedChats;
    });
  };

  const selectChat = (chat: ChatInfo) => {
    console.log('Selecting chat:', chat);
    setSelectedChat(chat.userId);
    // Rimuovi la chat dagli unread quando viene selezionata
    setUnreadChats(prev => {
      const newUnread = new Set(prev);
      newUnread.delete(chat.userId);
      return newUnread;
    });
  };

  const overallLoading = authLoading || isLoadingInitialChats;

  if (overallLoading) {
    console.log('Rendering loading state:', { authLoading, isLoadingInitialChats });
    return <div className="flex justify-center items-center h-screen">Loading chat...</div>;
  }

  if (!user) {
     console.log('Rendering null state: user not found');
     return null;
  }

   console.log('Rendering chat interface:', { user, selectedChat, chats: chats.length, messages: messages.length });

  return (
    <div className="flex h-[calc(100vh-64px)] antialiased text-gray-800">
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        <div className="flex flex-col py-8 pl-6 pr-2 w-80 bg-white flex-shrink-0">
          <div className="flex flex-row items-center justify-center h-12 w-full">
            <div className="flex items-center justify-center rounded-2xl text-indigo-700 bg-indigo-100 h-10 w-10">
              <UserIcon size={24} />
            </div>
            <div className="ml-2 font-bold text-2xl">Chats</div>
          </div>
          <div className="flex flex-col mt-8">
            <div className="flex items-center h-12 px-2 border border-gray-200 rounded-full w-full">
              <SearchIcon size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="flex-grow ml-2 outline-none"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                disabled={isSearching}
              />
            </div>
          </div>
          {isSearching && searchTerm && searchResults.length === 0 && (
            <div className="flex flex-col mt-2 border-t border-gray-200 pt-2">
              <div className="font-semibold text-gray-600">Search Results</div>
              <p className="text-center text-gray-500 mt-2">Searching...</p>
            </div>
          )}
           {!isSearching && searchTerm && searchResults.length === 0 && (
            <div className="flex flex-col mt-2 border-t border-gray-200 pt-2">
               <div className="font-semibold text-gray-600">Search Results</div>
               <p className="text-center text-gray-500 mt-2">No users found.</p>
             </div>
          )}
          {searchResults.length > 0 && (
            <div className="flex flex-col mt-2 border-t border-gray-200 pt-2 max-h-40 overflow-y-auto">
              <div className="font-semibold text-gray-600">Search Results</div>
              <ul className="mt-2 space-y-2">
                {searchResults.map((result) => (
                  <li
                    key={result._id}
                    className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => startNewChat(result)}
                  >
                    <div className="flex-shrink-0">
                      {result.profilePhoto ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={result.profilePhoto}
                          alt={result.username}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                          {result.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="font-semibold text-gray-800">{result.username}</div>
                      <div className="text-sm text-gray-500">{result.email}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!searchTerm && (
          <div className="mt-8 flex flex-col space-y-2 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-indigo-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-button]:hidden">
            {chats.length === 0 ? (
              <div className="text-center text-gray-500">No conversations yet. Search for users to start a chat.</div>
            ) : (
              chats.map((chat) => {
              if (!chat || !chat.userId || !chat.username) {
                 console.warn('Skipping invalid chat object in rendering:', chat);
                 return null;
              }
              
              const otherUser = { 
                _id: chat.userId, 
                username: chat.username, 
                email: chat.email, 
                profilePhoto: chat.profilePhoto 
              } as PopulatedUser;

              return (
                <button
                  key={chat.userId}
                  className={`flex flex-row items-center p-3 rounded-xl ${
                    selectedChat === chat.userId 
                      ? 'bg-indigo-100' 
                      : unreadChats.has(chat.userId)
                        ? 'border-2 border-green-500 hover:bg-gray-100'
                        : 'hover:bg-gray-100'
                  }`}
                  onClick={() => selectChat(chat)}
                >
                  <div className="flex-shrink-0">
                    {otherUser.profilePhoto ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={otherUser.profilePhoto}
                        alt={otherUser.username}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                        {otherUser.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow ml-3 text-left">
                    <div className="text-sm font-semibold">{otherUser.username}</div>
                    {chat.lastMessage && (
                      <span className="text-xs truncate block text-gray-500">
                        {chat.lastMessage.senderId === user?._id ? 'You: ' : ''}
                        {chat.lastMessage.text}
                      </span>
                    )}
                  </div>
                   {chat.lastMessage && (
                     <div className="text-xs text-gray-500 ml-auto flex-shrink-0">
                       {formatMessageTime(chat.lastMessage.sent_at)}
                     </div>
                   )}
                </button>
              );
            })
            )}
          </div>
          )}
        </div>
        <div className="flex flex-col flex-auto h-full p-6">
          {!selectedChat ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-xl text-gray-500">Select a chat or search for a user to start a conversation</div>
            </div>
          ) : (
            <>
              {selectedChatUser && (
                <div className="flex flex-row items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    {selectedChatUser.profilePhoto ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={selectedChatUser.profilePhoto}
                        alt={selectedChatUser.username}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                         {selectedChatUser.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-lg font-semibold">{selectedChatUser.username}</div>
                  </div>
                </div>
              )}
              <div className="flex flex-col flex-auto h-full overflow-y-auto">
                <div className="flex flex-col flex-grow">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Start of conversation</div>
                  ) : (
                    <>
                      {messages.map((message, index) => (
                        <div 
                          key={message.id || index}
                          className={`flex w-full mt-2 space-x-3 max-w-xs ${message.sender._id === user?._id ? 'ml-auto justify-end' : ''}`}
                        >
                           {message.sender._id !== user?._id && message.sender.profilePhoto && (
                              <div className="flex-shrink-0">
                                <img className="h-10 w-10 rounded-full" src={message.sender.profilePhoto} alt={message.sender.username} />
                              </div>
                            )}
                           {message.sender._id !== user?._id && !message.sender.profilePhoto && message.sender.username && (
                               <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                                 {message.sender.username.charAt(0).toUpperCase()}
                               </div>
                           )}

                          <div>
                            <div className={`px-4 py-2 rounded-lg inline-block ${message.sender._id === user?._id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                              {message.message}
                            </div>
                            <span className={`block text-xs text-gray-500 mt-1 ${message.sender._id === user?._id ? 'text-right' : 'text-left'}`}>
                              {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                           {message.sender._id === user?._id && message.sender.profilePhoto && (
                              <div className="flex-shrink-0">
                                <img className="h-10 w-10 rounded-full" src={message.sender.profilePhoto} alt={message.sender.username} />
                              </div>
                           )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <div className="relative flex w-full items-center border border-gray-300 rounded-full p-3 shadow-sm">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-grow outline-none pl-3 pr-12"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    className="absolute right-0 top-0 bottom-0 px-5 flex items-center justify-center text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                    disabled={!newMessage.trim() || !socket || !user?._id || !selectedChatUser?._id}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}