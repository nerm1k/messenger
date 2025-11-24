import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/api';
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
  }, []);

  const loadDialogs = async () => {
    try {
      setIsLoading(true);
      const dialogs: DialogResponse[] = await apiService.getMyDialogs();
      
      const chatItems: ChatItem[] = dialogs.map(dialog => ({
        id: dialog.id,
        username: dialog.other_user.username,
        avatar_url: dialog.other_user.avatar_url,
        lastMessage: dialog.last_message?.content || 'Диалог создан',
        unread: dialog.unread_count
      }));
      
      setChats(chatItems);
    } catch (error) {
      console.error('Error loading dialogs:', error);
    } finally {
      setIsLoading(false);
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
      
      if (result.existing) {
        console.log('Диалог уже существовал');
      } else {
        console.log('Новый диалог создан');
      }
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
            onChatSelect={setSelectedChat}
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