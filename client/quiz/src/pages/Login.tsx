import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
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

// URL base da API - ajustar conforme necessário
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const validateFields = (): boolean => {
    if (!email || email.trim() === '') {
      setToastMessage('Por favor, preencha o campo de email');
      setShowToast(true);
      return false;
    }

    // Validação básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setToastMessage('Por favor, insira um email válido');
      setShowToast(true);
      return false;
    }

    if (!password || password.trim() === '') {
      setToastMessage('Por favor, preencha o campo de senha');
      setShowToast(true);
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    // Validar campos antes de prosseguir
    if (!validateFields()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password
        })
      });

      const data = await response.json();

      if (data && data.token) {
        // Armazenar token no localStorage
        localStorage.setItem('authToken', data.token);
        
        // Redirecionar para a página home apenas se o login for bem-sucedido
        history.push('/app/home');
      } else {
        // Login falhou - credenciais inválidas
        setToastMessage('Email ou senha incorretos. Por favor, tente novamente.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Erro ao realizar login:', error);
      setToastMessage('Erro ao conectar com o servidor. Por favor, tente novamente mais tarde.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
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
              <IonInput 
                placeholder="seu@email.com" 
                type="email" 
                value={email}
                onIonInput={(e) => setEmail(e.detail.value!)}
              />
            </IonItem>

            <label>Senha</label>
            <IonItem lines="none" className="custom-input">
              <IonIcon slot="start" icon={lockClosedOutline} />
              <IonInput 
                placeholder="........" 
                type="password" 
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
              />
              <IonIcon slot="end" icon={eyeOutline} className="eye-icon" />
            </IonItem>

            <div className="forgot-password">
              <a href="#">🗝️ Esqueci minha senha</a>
            </div>

            {/* Botão de Ação */}
            <IonButton 
              expand="block" 
              className="main-button" 
              onClick={handleLogin}
              disabled={isLoading}
            >
              <IonIcon slot="start" icon={trophyOutline} />
              {isLoading ? 'Entrando...' : 'Entrar no Soccer Quiz'}
            </IonButton>

          </div>
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