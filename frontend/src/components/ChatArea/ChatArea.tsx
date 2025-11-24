import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { websocketService } from '../../api/websocket';
import { apiService } from '../../api/api';
import { type MessageResponse } from '../../types/dialog';
import styles from './ChatArea.module.scss';

interface Chat {
  id: number;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  unread: number;
}

interface ChatAreaProps {
  selectedChat: Chat | null;
}

const ChatArea = ({ selectedChat }: ChatAreaProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (selectedChat) {
      loadMessages();
      websocketService.markAsRead(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.type === 'new_message' && data.message.dialog_id === selectedChat?.id) {
        setMessages(prev => [...prev, data.message]);
        
        if (data.message.sender_id !== user?.id && selectedChat) {
          websocketService.markAsRead(selectedChat.id);
        }
      }
    };

    const handleTyping = (data: any) => {
      if (data.type === 'user_typing' && data.dialog_id === selectedChat?.id) {
        setIsTyping(data.is_typing);
        setTypingUser(data.username);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    const handleMessagesRead = (data: any) => {
      if (data.type === 'messages_read' && data.dialog_id === selectedChat?.id) {
        console.log('Сообщения прочитаны пользователем:', data.reader_id);
      }
    };

    websocketService.onMessage(handleNewMessage);
    websocketService.onMessage(handleTyping);
    websocketService.onMessage(handleMessagesRead);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [selectedChat, user]);

  const loadMessages = async () => {
    if (!selectedChat) return;
    
    setIsLoading(true);
    try {
      const messagesHistory = await apiService.getDialogMessages(selectedChat.id);
      setMessages(messagesHistory);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat) return;

    websocketService.sendTextMessage(selectedChat.id, newMessage.trim());
    
    setNewMessage('');
    
    websocketService.sendTyping(selectedChat.id, false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (selectedChat) {
      websocketService.sendTyping(selectedChat.id, true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedChat) {
    return (
      <div className={styles['no-chat-selected']}>
        <h3>Выберите чат для начала общения</h3>
        <p>или найдите нового собеседника через поиск</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles['container__header']}>
        <img 
          src={selectedChat.avatar_url || '/default-avatar.png'} 
          alt={selectedChat.username}
          className={styles['header__avatar']}
        />
        <div className={styles['header__info']}>
          <div className={styles['info__username']}>{selectedChat.username}</div>
          <div className={styles['info__status']}>
            {isTyping ? `${typingUser} печатает...` : 'online'}
          </div>
        </div>
      </div>

      <div className={styles['container__messages']}>
        {isLoading ? (
          <div className={styles.loading}>Загрузка сообщений...</div>
        ) : messages.length === 0 ? (
          <div className={styles.welcome}>
            <p>Начните общение с {selectedChat.username}</p>
            <p>Это начало вашей переписки</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.sender_id === user?.id ? styles.message_own : styles.message_other
                }`}
              >
                {message.sender_id !== user?.id && (
                  <img 
                    src={message.sender.avatar_url || '/default-avatar.png'} 
                    alt={message.sender.username}
                    className={styles.message__avatar}
                  />
                )}
                <div className={styles.message__content}>
                  <div className={styles.message__text}>{message.content}</div>
                  <div className={styles.message__time}>
                    {formatTime(message.created_at)}
                    {message.sender_id === user?.id && (
                      <span className={styles.message__status}>
                        {message.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className={styles['container__input']}>
        <input
          type="text"
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className={styles.input}
        />
        <button 
          type="submit" 
          className={styles['send-button']}
          disabled={!newMessage.trim()}
        >
          Отправить
        </button>
      </form>
    </div>
  );
};

export default ChatArea;