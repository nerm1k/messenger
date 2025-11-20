import { useState } from 'react';
import Input from '../../Input/Input';
import { validateEmail, validatePassword } from '../../../utils/validation';
import { type LoginData } from '../../../types/auth';
import styles from './LoginForm.module.scss';

interface LoginFormProps {
  onSubmit: (data: LoginData) => void;
  isLoading?: boolean;
}

const LoginForm = ({ onSubmit, isLoading = false }: LoginFormProps) => {
  const [formData, setFormData] = useState<LoginData>({
    username: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });

  const validateForm = (): boolean => {
    const usernameError = validateEmail(formData.username);
    const passwordError = validatePassword(formData.password);
    
    setErrors({
      username: usernameError,
      password: passwordError,
    });
    
    return !usernameError && !passwordError;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof LoginData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Input
        type="text"
        value={formData.username}
        onChange={handleChange('username')}
        placeholder="Username"
        error={errors.username}
        disabled={isLoading}
      />
      
      <Input
        type="password"
        value={formData.password}
        onChange={handleChange('password')}
        placeholder="Пароль"
        error={errors.password}
        disabled={isLoading}
      />
      
      <button 
        type="submit" 
        disabled={isLoading}
        className={styles['submit-button']}
      >
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
};

export default LoginForm;