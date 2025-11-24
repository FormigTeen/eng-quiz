import React from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonToast
} from '@ionic/react';
import {
  footballOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  trophyOutline
} from 'ionicons/icons';
import './Login.css';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// URL base da API - ajustar conforme necessário
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Login: React.FC = () => {
  const history = useHistory();
  const [segment, setSegment] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const { sendLogin, isLoggingIn, loginError } = useAuth();

  React.useEffect(() => {
    if (segment === 'signup') history.push('/register');
  }, [segment, history]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendLogin({ email, password });
      history.push('/app/home');
    } catch (err) {
      // handled by loginError display
    }
  };

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
          <IonSegment value={segment} onIonChange={(e) => setSegment(e.detail.value as 'login' | 'signup')} mode="ios" className="custom-segment">
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
          <form className="form-inputs" onSubmit={onSubmit}>

            <label>Email</label>
            <IonItem lines="none" className="custom-input">
              <IonIcon slot="start" icon={mailOutline} />
              <IonInput
                placeholder="seu@email.com"
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value || '')}
                required
              />
            </IonItem>

            <label>Senha</label>
            <IonItem lines="none" className="custom-input">
              <IonIcon slot="start" icon={lockClosedOutline} />
              <IonInput
                placeholder="........"
                type="password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value || '')}
                required
              />
              <IonIcon slot="end" icon={eyeOutline} className="eye-icon" />
            </IonItem>

            {loginError && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span style={{ color: '#e53935', fontWeight: 600, fontSize: 13 }}>
                  {(loginError as Error).message || 'Falha no login'}
                </span>
              </div>
            )}

            <div className="forgot-password">
              <a href="#">🗝️ Esqueci minha senha</a>
            </div>

            {/* Botão de Ação */}
            <IonButton type="submit" expand="block" className="main-button" disabled={isLoggingIn}>
              <IonIcon slot="start" icon={trophyOutline} />
              {isLoggingIn ? 'Entrando...' : 'Entrar no Soccer Quiz'}
            </IonButton>

          </form>
        </div>

        {/* Toast para exibir mensagens de erro */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
          position="top"
        />

      </IonContent>
    </IonPage>
  );
};

export default Login;
