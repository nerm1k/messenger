import { useState } from 'react';
import Input from '../../Input/Input';
import { 
  validateEmail, 
  validatePassword, 
  validateUsername,
  validateConfirmPassword 
} from '../../../utils/validation';
import { type RegisterData } from '../../../types/auth';
import styles from './RegisterForm.module.scss';

interface RegisterFormProps {
  onSubmit: (data: RegisterData) => void;
  isLoading?: boolean;
}

const RegisterForm = ({ onSubmit, isLoading = false }: RegisterFormProps) => {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = (): boolean => {
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    
    setErrors({
      username: usernameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });
    
    return !usernameError && !emailError && !passwordError && !confirmPasswordError;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof RegisterData) => (
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
        placeholder="Имя пользователя"
        error={errors.username}
        disabled={isLoading}
      />
      
      <Input
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        placeholder="Email"
        error={errors.email}
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
      
      <Input
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange('confirmPassword')}
        placeholder="Подтвердите пароль"
        error={errors.confirmPassword}
        disabled={isLoading}
      />
      
      <button 
        type="submit" 
        disabled={isLoading}
        className={styles['submit-button']}
      >
        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
};

export default RegisterForm;