import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log('Logout');
    try {
      await apiService.logout();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={styles.header}>
      <button 
        className={styles['header__profile-button']}
        onClick={() => navigate('/profile')}
      >
        <img 
          src={user?.avatar_url || '/default-avatar.png'} 
          alt="Avatar" 
          className={styles.avatar}
        />
        <span className={styles.username}>{user?.username}</span>
      </button>
      
      <button onClick={handleLogout} className={styles['header__logout-button']}>
        Выйти
      </button>
    </header>
  );
};

export default Header;