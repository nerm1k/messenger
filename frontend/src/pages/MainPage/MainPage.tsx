import ChatLayout from '../../components/ChatLayout/ChatLayout';
import Header from '../../components/Header/Header';

import styles from './MainPage.module.scss';

const MainPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.chats}>
        <Header />
        <ChatLayout />
      </div>
    </div>
  );
};

export default MainPage;