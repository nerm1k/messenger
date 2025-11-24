import styles from './ChatsList.module.scss';

interface Chat {
  id: number;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  unread: number;
}

interface ChatsListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
}

const ChatsList = ({ chats, selectedChat, onChatSelect }: ChatsListProps) => {
  return (
    <div className={styles.container}>
      <h3 className={styles.container__title}>Чаты</h3>
      <div className={styles.chats}>
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`${styles['chats__item']} ${selectedChat?.id === chat.id ? styles.active : ''}`}
            onClick={() => onChatSelect(chat)}
          >
            <img 
              src={chat.avatar_url || '/default-avatar.png'} 
              alt={chat.username}
              className={styles['chat-avatar']}
            />
            <div className={styles['chats__info']}>
              <div className={styles['info__username']}>{chat.username}</div>
              <div className={styles['info__last-message']}>{chat.lastMessage}</div>
            </div>
            {chat.unread > 0 && (
              <div className={styles['unread-badge']}>{chat.unread}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatsList;