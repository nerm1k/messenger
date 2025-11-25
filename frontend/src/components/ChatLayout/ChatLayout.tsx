import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/api';
import { websocketService } from '../../api/websocket';
import { type DialogResponse } from '../../types/dialog';
import { type User } from '../../types/auth';
import ChatsList from '../ChatsList/ChatsList';
import ChatArea from '../ChatArea/ChatArea';
import styles from './ChatLayout.module.scss';

interface ChatItem {
  id: number;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  unread: number;
  updated_at: Date;
}

const ChatLayout = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDialogs();
    setupWebSocketListeners();
    
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const setupWebSocketListeners = () => {
    websocketService.onMessage((data) => {
      if (data.type === 'new_message') {
        handleNewMessage(data.message);
      } else if (data.type === 'messages_read') {
        handleMessagesRead(data.dialog_id);
      }
    });
  };

  const handleNewMessage = (message: any) => {
    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(chat => chat.id === message.dialog_id);
      
      if (chatIndex === -1) {
        if (message.sender_id !== user?.id) {
          loadDialogs();
        }
        return prevChats;
      }

      const updatedChats = [...prevChats];
      const chat = updatedChats[chatIndex];
      
      const shouldIncrementUnread = message.sender_id !== user?.id && selectedChat?.id !== message.dialog_id;
      
      updatedChats[chatIndex] = {
        ...chat,
        lastMessage: message.content,
        updated_at: new Date(),
        unread: shouldIncrementUnread ? chat.unread + 1 : chat.unread
      };

      return updatedChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    });
  };

  const handleMessagesRead = (dialogId: number) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === dialogId ? { ...chat, unread: 0 } : chat
      )
    );
  };

  const loadDialogs = async () => {
    try {
      setIsLoading(true);
      const dialogs: DialogResponse[] = await apiService.getMyDialogs();
      
      const chatItems: ChatItem[] = dialogs.map(dialog => ({
        id: dialog.id,
        username: dialog.other_user.username,
        avatar_url: dialog.other_user.avatar_url,
        lastMessage: dialog.last_message?.content || 'Диалог создан',
        unread: dialog.unread_count,
        updated_at: new Date(dialog.updated_at)
      }));
      
      const sortedChats = chatItems.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      setChats(sortedChats);
    } catch (error) {
      console.error('Error loading dialogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSelect = (chat: ChatItem) => {
    setSelectedChat(chat);
    
    if (chat.unread > 0) {
      setChats(prevChats => 
        prevChats.map(c => 
          c.id === chat.id ? { ...c, unread: 0 } : c
        )
      );
      
      websocketService.markAsRead(chat.id);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.length < 2) {
      alert('Введите минимум 2 символа для поиска');
      return;
    }

    setIsSearching(true);
    try {
      const users: User[] = await apiService.searchUsers(searchQuery);
      setSearchResults(users);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateDialog = async (userData: User) => {
    try {
      const result = await apiService.createDialog(userData.id);
      console.log('Dialog created:', result);
      
      await loadDialogs();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Create dialog error:', error);
      alert('Ошибка при создании диалога');
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value === '') {
      setSearchResults([]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles['left-column']}>
        <div className={styles.search}>
          <form onSubmit={handleSearch} className={styles.search__form}>
            <input
              type="text"
              placeholder="Поиск по username..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className={styles.search__input}
            />
            <button 
              type="submit" 
              className={styles.search__button}
              disabled={isSearching}
            >
              {isSearching ? '...' : 'Найти'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className={styles.search__results}>
              {searchResults.map(userData => (
                <div
                  key={userData.id}
                  className={styles.search__result}
                  onClick={() => handleCreateDialog(userData)}
                >
                  <img 
                    src={userData.avatar_url || '/default-avatar.png'} 
                    alt={userData.username}
                    className={styles.search__avatar}
                  />
                  <div className={styles.search__info}>
                    <div className={styles.search__username}>
                      {userData.username}
                    </div>
                    <div className={styles.search__action}>
                      Создать диалог
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className={styles.loading}>Загрузка диалогов...</div>
        ) : (
          <ChatsList 
            chats={chats} 
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
          />
        )}
      </div>
      
      <div className={styles['right-column']}>
        <ChatArea selectedChat={selectedChat} />
      </div>
    </div>
  );
};

export default ChatLayout;