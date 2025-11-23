import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/Auth/RegisterForm/RegisterForm';
import { type RegisterData } from '../../types/auth';
import { apiService } from '../../api/api';
import styles from './RegisterPage.module.scss';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (registerData: RegisterData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const { confirmPassword, ...dataToSend } = registerData;
      const response = await apiService.register(dataToSend);
      login(response);
      console.log('Registration successful:', response);
      navigate('/')
    } catch (err) {
      setError('Ошибка регистрации. Возможно, пользователь уже существует.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.card__title}>Регистрация</h1>
        
        {error && <div className={styles['error-alert']}>{error}</div>}
        
        <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
        
        <p className={styles['card__switch-text']}>
          Уже есть аккаунт? <Link to="/login" className={styles.link}>Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;