import styles from './Input.module.scss';

interface InputProps {
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
}

const Input = ({
  type,
  value,
  onChange,
  placeholder,
  error,
  disabled = false
}: InputProps) => {
  return (
    <div className={styles.container}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${styles.input} ${error ? styles['input--error'] : ''}`}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export default Input;