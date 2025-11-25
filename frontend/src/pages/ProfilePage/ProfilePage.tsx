import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api/api';
import { 
  validateEmail, 
  validatePassword, 
  validateUsername, 
  validateConfirmPassword 
} from '../../utils/validation';
import Input from '../../components/Input/Input';
import styles from './ProfilePage.module.scss';
import { type ProfileData } from '../../types/auth';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileData>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        username: user.username,
        email: user.email
      }));
    }
  }, [user]);

  const handleChange = (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileData> = {};

    const usernameError = validateUsername(profileData.username);
    if (usernameError) {
      newErrors.username = usernameError;
    }

    const emailError = validateEmail(profileData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    if (profileData.newPassword) {
      if (!profileData.currentPassword) {
        newErrors.currentPassword = 'Текущий пароль обязателен для смены пароля';
      }

      const newPasswordError = validatePassword(profileData.newPassword);
      if (newPasswordError) {
        newErrors.newPassword = newPasswordError;
      }

      const confirmPasswordError = validateConfirmPassword(profileData.newPassword, profileData.confirmPassword);
      if (confirmPasswordError) {
        newErrors.confirmPassword = confirmPasswordError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        username: profileData.username,
        email: profileData.email
      };

      if (profileData.newPassword) {
        updateData.current_password = profileData.currentPassword;
        updateData.new_password = profileData.newPassword;
      }

      const updatedUser = await apiService.updateProfile(updateData);
      updateUser(updatedUser);
      
      setSuccessMessage('Профиль успешно обновлен!');
      
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

    } catch (error: any) {
      console.error('Profile update error:', error);
      if (error.message?.includes('Email already exists')) {
        setErrors({ email: 'Этот email уже используется' });
      } else if (error.message?.includes('Username already exists')) {
        setErrors({ username: 'Это имя пользователя уже занято' });
      } else if (error.message?.includes('Current password is incorrect')) {
        setErrors({ currentPassword: 'Неверный текущий пароль' });
      } else {
        setErrors({ currentPassword: 'Ошибка при обновлении профиля' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Пользователь не авторизован</div>
      </div>
    );
  }

  return (
    <div className={styles['wide-container']}>
        <div className={styles.container}>
        <div className={styles.header}>
            <button onClick={handleCancel} className={styles.backButton}>
            ← Назад
            </button>
            <h1>Редактирование профиля</h1>
        </div>

        <div className={styles.content}>
            <div className={styles.avatarSection}>
            <img 
                src={user.avatar_url || '/default-avatar.png'} 
                alt="Avatar"
                className={styles.avatar}
            />
            <button className={styles.changeAvatarButton}>
                Сменить аватар
            </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
            {successMessage && (
                <div className={styles.successMessage}>{successMessage}</div>
            )}

            <div className={styles.formGroup}>
                <label htmlFor="username" className={styles.label}>
                Имя пользователя
                </label>
                <Input
                type="text"
                value={profileData.username}
                onChange={handleChange('username')}
                placeholder="Введите имя пользователя"
                error={errors.username}
                disabled={isLoading}
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                Email
                </label>
                <Input
                type="email"
                value={profileData.email}
                onChange={handleChange('email')}
                placeholder="Введите email"
                error={errors.email}
                disabled={isLoading}
                />
            </div>

            <div className={styles.passwordSection}>
                <h3>Смена пароля</h3>
                <p className={styles.passwordHint}>
                Оставьте эти поля пустыми, если не хотите менять пароль
                </p>

                <div className={styles.formGroup}>
                <label htmlFor="currentPassword" className={styles.label}>
                    Текущий пароль
                </label>
                <Input
                    type="password"
                    value={profileData.currentPassword}
                    onChange={handleChange('currentPassword')}
                    placeholder="Введите текущий пароль"
                    error={errors.currentPassword}
                    disabled={isLoading}
                />
                </div>

                <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                    Новый пароль
                </label>
                <Input
                    type="password"
                    value={profileData.newPassword}
                    onChange={handleChange('newPassword')}
                    placeholder="Введите новый пароль"
                    error={errors.newPassword}
                    disabled={isLoading}
                />
                </div>

                <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                    Подтвердите новый пароль
                </label>
                <Input
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    placeholder="Повторите новый пароль"
                    error={errors.confirmPassword}
                    disabled={isLoading}
                />
                </div>
            </div>

            <div className={styles.buttons}>
                <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelButton}
                disabled={isLoading}
                >
                Отмена
                </button>
                <button
                type="submit"
                className={styles.saveButton}
                disabled={isLoading}
                >
                {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
            </div>
            </form>
        </div>
        </div>
    </div>
  );
};

export default ProfilePage;