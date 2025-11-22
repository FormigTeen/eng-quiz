import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton
} from '@ionic/react';
import {
  footballOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  trophyOutline
} from 'ionicons/icons';
import './Login.css';

const Login: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding custom-background">

        {/* 1. Cabeçalho com Logo */}
        <div className="header-container">
          <div className="logo-circle">
            <IonIcon icon={footballOutline} />
          </div>
          <h1 className="app-title">Soccer Quiz</h1>
          <p className="app-subtitle">🏆 O melhor quiz de futebol do Brasil! 🏆</p>
        </div>

        {/* 2. Card Principal */}
        <div className="login-card">

          {/* Abas: Entrar vs Criar Conta */}
          <IonSegment value="login" mode="ios" className="custom-segment">
            <IonSegmentButton value="login">
              <IonLabel>Entrar</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="signup">
              <IonLabel>Criar Conta</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* Texto de Boas-vindas */}
          <div className="welcome-text">
            <h2>Bem-vindo de volta!</h2>
            <p>Entre com suas credenciais para continuar</p>
          </div>

          {/* Formulário */}
          <div className="form-inputs">

            <label>Email</label>
            <IonItem lines="none" className="custom-input">
              <IonIcon slot="start" icon={mailOutline} />
              <IonInput placeholder="seu@email.com" type="email" />
            </IonItem>

            <label>Senha</label>
            <IonItem lines="none" className="custom-input">
              <IonIcon slot="start" icon={lockClosedOutline} />
              <IonInput placeholder="........" type="password" />
              <IonIcon slot="end" icon={eyeOutline} className="eye-icon" />
            </IonItem>

            <div className="forgot-password">
              <a href="#">🗝️ Esqueci minha senha</a>
            </div>

            {/* Botão de Ação */}
            <IonButton expand="block" className="main-button" routerLink="/app/home">
              <IonIcon slot="start" icon={trophyOutline} />
              Entrar no Soccer Quiz
            </IonButton>

          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Login;