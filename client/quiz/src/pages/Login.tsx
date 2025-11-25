import React, { useState } from 'react';
import {
  IonContent, IonPage, IonButton, IonIcon, IonInput,
  IonItem, IonText
} from '@ionic/react';
import {
  footballOutline, mailOutline, lockClosedOutline,
  eyeOutline, eyeOffOutline,
  trophyOutline, arrowForwardOutline
} from 'ionicons/icons';
import './Login.css';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const { sendLogin, isLoggingIn, loginError } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendLogin({ email, password });
      history.push('/app/home');
    } catch (err) {
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding custom-background">

        <div className="header-container">
          <div className="logo-circle">
            <IonIcon icon={footballOutline} />
          </div>
          <h1 className="app-title">Soccer Quiz</h1>
          <p className="app-subtitle">🏆 O melhor quiz de futebol do Brasil! 🏆</p>
        </div>

        <div className="login-card">
          <div className="welcome-text" style={{ marginTop: '10px' }}>
            <h2>Bem-vindo de volta!</h2>
            <p>Entre com suas credenciais para continuar</p>
          </div>

          <form className="form-inputs" onSubmit={onSubmit}>

            <label>Email</label>
            <IonItem lines="none" className="custom-input">
              <IonIcon slot="start" icon={mailOutline} />
              <IonInput
                placeholder="seu@email.com"
                type="email"
                value={email}
                onIonChange={e => setEmail(e.detail.value!)}
                required
              />
            </IonItem>

            <label>Senha</label>
            <IonItem lines="none" className="custom-input">
              <IonIcon slot="start" icon={lockClosedOutline} />
              <IonInput
                type={showPassword ? "text" : "password"}
                placeholder="........"
                value={password}
                onIonChange={e => setPassword(e.detail.value!)}
                required
              />
              <IonIcon
                slot="end"
                icon={showPassword ? eyeOffOutline : eyeOutline}
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              />
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

            <IonButton type="submit" expand="block" className="main-button" disabled={isLoggingIn}>
              <IonIcon slot="start" icon={trophyOutline} />
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </IonButton>

            <div className="footer-action">
              <IonText color="medium">
                <p>Não tem uma conta?</p>
              </IonText>
              <IonButton
                fill="clear"
                className="secondary-link"
                onClick={() => history.push('/register')}
              >
                Criar Conta Grátis <IonIcon slot="end" icon={arrowForwardOutline} />
              </IonButton>
            </div>

          </form>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Login;