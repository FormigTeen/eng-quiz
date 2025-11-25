import React, { useState } from 'react';
import {
  IonContent, IonPage, IonButton, IonIcon, IonInput,
  IonItem, IonText
} from '@ionic/react';
import {
  footballOutline, mailOutline, lockClosedOutline,
  eyeOutline, eyeOffOutline,
  trophyOutline, logInOutline
} from 'ionicons/icons';
import './Login.css';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register: React.FC = () => {
  const history = useHistory();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const { sendRegister, isRegistering, registerError } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendRegister({ email, password });
      history.push('/login');
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
          <h1 className="app-title">Crie sua conta</h1>
          <p className="app-subtitle">Entre para o time do Soccer Quiz!</p>
        </div>

        <div className="login-card">

          <div className="welcome-text" style={{ marginTop: '10px' }}>
            <h2>Novo por aqui?</h2>
            <p>Preencha seus dados para começar</p>
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
                placeholder="Mínimo 6 caracteres"
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

            {registerError && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span style={{ color: '#e53935', fontWeight: 600, fontSize: 13 }}>
                  {(registerError as Error).message || 'Erro ao criar conta'}
                </span>
              </div>
            )}

            <IonButton type="submit" expand="block" className="main-button" disabled={isRegistering}>
              <IonIcon slot="start" icon={trophyOutline} />
              {isRegistering ? 'Criando...' : 'Cadastrar'}
            </IonButton>

            <div className="footer-action">
              <IonText color="medium">
                <p>Já tem uma conta?</p>
              </IonText>
              <IonButton
                fill="clear"
                className="secondary-link"
                onClick={() => history.push('/login')}
              >
                <IonIcon slot="start" icon={logInOutline} />
                Fazer Login
              </IonButton>
            </div>

          </form>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Register;