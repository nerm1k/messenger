export const validateEmail = (email: string): string => {
  if (!email) return 'Email обязателен';
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!emailRegex.test(email)) return 'Некорректный email';
  return '';
};

export const validatePassword = (password: string): string => {
  if (!password) return 'Пароль обязателен';
  if (password.length < 6) return 'Пароль должен быть не менее 6 символов';
  return '';
};

export const validateUsername = (username: string): string => {
  if (!username) return 'Имя пользователя обязательно';
  if (username.length < 3) return 'Имя должно быть не менее 3 символов';
  return '';
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (password !== confirmPassword) return 'Пароли не совпадают';
  return '';
};