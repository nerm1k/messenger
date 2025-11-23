import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '../../components/Auth/LoginForm/LoginForm';
import { type LoginData } from '../../types/auth';
import { apiService } from '../../api/api';
import styles from './LoginPage.module.scss';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (loginData: LoginData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiService.login(loginData);
      console.log('Login successful:', response);
      login(response);
      navigate('/');
    } catch (err) {
      setError('Ошибка входа. Проверьте логин и пароль.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.card__title}>Вход</h1>
        
        {error && <div className={styles['error-alert']}>{error}</div>}
        
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        
        <p className={styles['card__switch-text']}>
          Нет аккаунта? <Link to="/register" className={styles.link}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;