import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { io, Socket } from 'socket.io-client';
import { apiService, PopulatedUser, ReceivedMessage, SimplifiedMessage, ChatInfo } from "../lib/api";
import { toast } from 'sonner';
import { Search as SearchIcon, User as UserIcon } from 'lucide-react';

export default function Chat() {
  const { user, loading: authLoading, socket } = useAuth();
  const [messages, setMessages] = useState<SimplifiedMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<PopulatedUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingInitialChats, setIsLoadingInitialChats] = useState(true);
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PopulatedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchChats = useCallback(async (userId: string) => {
    console.log(`Fetching chats for user: ${userId}`);
    try {
      setIsLoadingInitialChats(true);
      const data = await apiService.getUserConversations(userId);
      console.log('Fetched chats raw data:', data);
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

  useEffect(() => {
    console.log('First useEffect running:', { user, authLoading, socket: !!socket });
    if (authLoading || !user?._id || !socket) { 
      console.log('useEffect for socket listener and initial fetch returning early', { authLoading, user, socket: !!socket });
      setChats([]);
      setMessages([]);
      setSelectedChat(null);
      setSelectedChatUser(null);
      setIsLoadingInitialChats(false);
      return;
    }

    const handleReceiveMessage = (message: ReceivedMessage) => {
      console.log('Received message:', message);

      if (!message || !message.sender || !message.receiver || (!message.message && !message.message_text)) {
        console.error('Received invalid message format:', message);
        return;
      }

      const messageForCurrentUser = message.sender._id === user._id || message.receiver._id === user._id;
      if (!messageForCurrentUser) {
        console.log('Received message is not for current user, ignoring.');
        return;
      }

      const relevantChatId = message.sender._id === user._id ? message.receiver._id : message.sender._id;
      const messageContent = message.message || message.message_text;

      // Update chats list
      setChats(prevChats => {
        const chatIndex = prevChats.findIndex(chat => chat.userId === relevantChatId);
        let updatedChats = [...prevChats];

        if (chatIndex > -1) {
          const chatToUpdate = { ...updatedChats[chatIndex] };
          const isDuplicate = chatToUpdate.messages.some(msg => 
            msg.id === message.id || 
            (msg.message === messageContent && 
             msg.senderId === message.sender._id && 
             msg.receiverId === message.receiver._id)
          );
          
          if (!isDuplicate) {
            const newMessage: SimplifiedMessage = {
              id: message.id,
              message: messageContent,
              sender: message.sender,
              receiver: message.receiver,
              sent_at: message.sent_at,
              senderId: message.sender._id,
              receiverId: message.receiver._id
            };

            // If this is a confirmation of our own message, replace the temporary message
            if (message.sender._id === user._id) {
              chatToUpdate.messages = chatToUpdate.messages.map(msg => 
                msg.id.startsWith('temp-') && msg.message === messageContent ? newMessage : msg
              );
            } else {
              chatToUpdate.messages = [...chatToUpdate.messages, newMessage];
            }

            chatToUpdate.lastMessage = {
              text: messageContent,
              sent_at: message.sent_at
            };
            updatedChats[chatIndex] = chatToUpdate;
          }
        } else {
          console.log('Creating new chat entry for received message', message);
          const otherUser = message.sender._id === user._id ? message.receiver : message.sender;
          const newChat: ChatInfo = {
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
              sent_at: message.sent_at
            }
          };
          updatedChats = [newChat, ...updatedChats];
        }

        // Sort chats by last message time
        updatedChats.sort((a, b) => {
          const lastMsgA = a.lastMessage?.sent_at;
          const lastMsgB = b.lastMessage?.sent_at;
          if (!lastMsgA) return 1;
          if (!lastMsgB) return -1;
          return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
        });

        return updatedChats;
      });

      // Update current chat messages if this chat is selected
      if (selectedChat && relevantChatId === selectedChat) {
        setMessages(prev => {
          const isDuplicate = prev.some(msg => 
            msg.id === message.id || 
            (msg.message === messageContent && 
             msg.senderId === message.sender._id && 
             msg.receiverId === message.receiver._id)
          );
          
          if (isDuplicate) return prev;
          
          const newMessage: SimplifiedMessage = {
            id: message.id,
            message: messageContent,
            sender: message.sender,
            receiver: message.receiver,
            sent_at: message.sent_at,
            senderId: message.sender._id,
            receiverId: message.receiver._id
          };

          // If this is a confirmation of our own message, replace the temporary message
          if (message.sender._id === user._id) {
            return prev.map(msg => 
              msg.id.startsWith('temp-') && msg.message === messageContent ? newMessage : msg
            );
          }

          return [...prev, newMessage];
        });
      }
    };

    // Set up socket event listeners
    socket.on('receive', handleReceiveMessage);
    socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      toast.error('Connection error. Please try refreshing the page.');
    });
    socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast.warning('Connection lost. Please refresh the page.');
      } else if (reason === 'transport close') {
        toast.warning('Connection closed. Attempting to reconnect...');
      } else if (reason === 'ping timeout') {
        toast.warning('Connection timeout. Attempting to reconnect...');
      }
    });

    // Initial fetch of chats
    if (user._id) {
      fetchChats(user._id);
    }

    // Cleanup
    return () => {
      console.log('First useEffect cleanup running');
      if (socket) {
        socket.off('receive', handleReceiveMessage);
        socket.off('error');
        socket.off('disconnect');
      }
    };
  }, [user?._id, authLoading, socket, fetchChats, selectedChat]);

  useEffect(() => {
    console.log('Second useEffect running:', { selectedChat, user, chats: chats.length });
    if (selectedChat && user?._id) {
      console.log(`Loading chat details for selected chat: ${selectedChat}`);

      const currentChat = chats.find(chat => chat.userId === selectedChat);

      if (currentChat) {
        console.log('Found existing chat in chats state, setting messages and user details');
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
        console.log('Setting selected chat user from existing chat:', otherUser);
        setSelectedChatUser(otherUser);
      } else {
        console.log('Selected chat not found in chats state, assuming new chat with user previously selected.');
        setMessages([]);
      }
    } else if (!selectedChat) {
      console.log('No chat selected, clearing state');
      setMessages([]);
      setSelectedChatUser(null);
    }
  }, [selectedChat, chats, user?._id]);

  const handleSearch = async (query: string) => {
    console.log('Handling search for query:', query);
    setSearchTerm(query);
    if (!query) {
      console.log('Search query is empty, clearing results.');
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await apiService.searchUsers(query);
      console.log('Search results:', data);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
       console.log('Search finished.');
    }
  };

  const startNewChat = (userResult: PopulatedUser) => {
    console.log('Attempting to start a new chat with user:', userResult);
    const existingChat = chats.find(chat => 
      chat.userId === userResult._id
    );

    if (existingChat) {
      console.log('Chat with user already exists, selecting existing chat.', existingChat);
      setSelectedChat(existingChat.userId);
      const otherUser = { 
        _id: existingChat.userId, 
        username: existingChat.username, 
        email: existingChat.email, 
        profilePhoto: existingChat.profilePhoto 
      } as PopulatedUser;
      setSelectedChatUser(otherUser);
    } else {
      console.log('Chat with user does not exist, preparing for a new chat.');
      setSelectedChat(userResult._id);
      setSelectedChatUser(userResult);
      setMessages([]);
    }

    setSearchTerm('');
    setSearchResults([]);
  };

  const sendMessage = () => {
    console.log('Attempting to send message:', { newMessage, socket: !!socket, user: !!user, selectedChatUser: !!selectedChatUser });
    if (!newMessage.trim() || !socket || !user?._id || !selectedChatUser?._id) {
      console.log('Cannot send message: missing required data');
      return;
    }

    const conversationId = chats.find(chat => chat.userId === selectedChat)?.userId || selectedChat;
    console.log('Determined conversationId:', conversationId);

    const messageData = {
      sender: user._id, 
      receiver: selectedChatUser._id,
      message_text: newMessage.trim(),
      conversationId: conversationId !== selectedChatUser._id ? conversationId : undefined
    };

    const tempMessageId = 'temp-' + Date.now();
    console.log('Sending message via socket:', messageData);
    
    // Add error handling for socket emit
    socket.emit('send', messageData, (error: Error | null) => {
      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message. Please try again.');
        // Remove the temporary message if sending failed
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

    console.log('Optimistically adding message to UI:', tempMessage);
    setMessages(prev => [
      ...prev,
      tempMessage
    ]);

    setChats(prevChats => {
      console.log('Updating chats state optimistically.');
      const chatIndex = prevChats.findIndex(chat => chat.userId === selectedChat);
      let updatedChats = [...prevChats];

      if (chatIndex > -1) {
        console.log('Updating existing chat in chats list.');
        const chatToUpdate = { ...updatedChats[chatIndex] };
        chatToUpdate.messages = [...chatToUpdate.messages, tempMessage]; 
        chatToUpdate.lastMessage = {
          text: tempMessage.message,
          sent_at: tempMessage.sent_at
        };
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(chatToUpdate);
      } else {
        console.warn('Sending message to a user without an existing chat entry in chats list. Creating new temporary chat entry.');
        if (selectedChatUser && user) {
          const newChat: ChatInfo = {
            userId: selectedChatUser._id, 
            username: selectedChatUser.username, 
            email: selectedChatUser.email, 
            profilePhoto: selectedChatUser.profilePhoto,
            messages: [tempMessage], 
            lastMessage: {
              text: tempMessage.message,
              sent_at: tempMessage.sent_at
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
                  className={`flex flex-row items-center p-3 rounded-xl ${selectedChat === chat.userId ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
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
                      <span className="text-xs truncate block">{chat.lastMessage.text}</span>
                    )}
                  </div>
                   {chat.lastMessage && (
                     <div className="text-xs text-gray-500 ml-auto flex-shrink-0">
                       {new Date(chat.lastMessage.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    messages.map((message, index) => (
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
                    ))
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