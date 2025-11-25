import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonAvatar, IonButton, IonIcon,
  IonGrid, IonRow, IonCol, IonProgressBar, IonLabel, IonInput
} from '@ionic/react';
import {
  createOutline, ribbonOutline, flameOutline,
  timeOutline, statsChartOutline, logOutOutline,
  checkmarkOutline, closeOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { userAtom } from '../store/userStore';
import { useAuth } from '../hooks/useAuth';
import './Profile.css';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const setUser = useSetAtom(userAtom);
  const history = useHistory();

  // --- ESTADOS PARA EDIÇÃO DE NOME ---
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');

  // Carrega o nome atual quando o usuário chega (ou "Jogador" se não tiver)
  useEffect(() => {
    setTempName(user?.name || 'Jogador');
  }, [user]);

  const handleSaveName = () => {
    // AQUI: Futuramente você chamará a API para salvar no banco
    console.log("Salvando nome:", tempName);
    // user.name = tempName; // (Simulação)
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempName(user?.name || 'Jogador');
    setIsEditing(false);
  };
  // -----------------------------------

  const level = user?.level ?? 1;
  const coins = user?.wallet?.credits ?? 0;
  const xp = user?.xp ?? 0;
  const progress = Math.min((xp % 100) / 100, 1);

  const handleLogout = () => {
    setUser({
      email: 'Visitante',
      isAuthenticated: false,
      token: ''
    });
    history.push('/login');
  };

  return (
    <IonPage>
      <IonContent fullscreen className="profile-bg">

        {/* 1. CARD DO USUÁRIO (VERDE) */}
        <div className="user-card section-margin">
          <div className="avatar-container">
            <IonAvatar className="big-avatar">
              <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="Avatar" />
            </IonAvatar>
            <span className="level-badge">👑 Nível {level}</span>
          </div>

          <div className="user-inputs">

            {/* CAMPO DE NOME (EDITÁVEL) */}
            <div className="input-group">
              <IonLabel>Nome</IonLabel> {/* Alterado de Nome Completo */}

              {isEditing ? (
                // MODO EDIÇÃO
                <div className="fake-input editing-mode">
                  <IonInput
                    value={tempName}
                    onIonChange={e => setTempName(e.detail.value!)}
                    className="white-input"
                  />
                  <div className="edit-actions">
                    <IonIcon icon={checkmarkOutline} onClick={handleSaveName} style={{ color: 'white', marginRight: 10 }} />
                    <IonIcon icon={closeOutline} onClick={handleCancelEdit} style={{ color: 'rgba(255,255,255,0.6)' }} />
                  </div>
                </div>
              ) : (
                // MODO VISUALIZAÇÃO
                <div className="fake-input" onClick={() => setIsEditing(true)}>
                  <span>{tempName}</span>
                  <IonIcon icon={createOutline} />
                </div>
              )}
            </div>

            {/* CAMPO DE EMAIL (LEITURA APENAS) */}
            <div className="input-group">
              <IonLabel>Email</IonLabel>
              <div className="fake-input readonly">
                <span>{user?.email || '—'}</span>
                {/* Ícone removido daqui conforme pedido */}
              </div>
            </div>

          </div>
        </div>

        {/* 2. ESTATÍSTICAS */}
        <div className="section-title">Suas Estatísticas</div>
        <IonGrid className="stats-grid section-margin">
          <IonRow>
            <IonCol size="6">
              <div className="stat-card">
                <div className="icon-box green"><IonIcon icon={ribbonOutline} /></div>
                <h3>Nível {level}</h3>
                <p>Nível Atual</p>
              </div>
            </IonCol>
            <IonCol size="6">
              <div className="stat-card">
                <div className="icon-box orange"><IonIcon icon={statsChartOutline} /></div>
                <h3>{coins}</h3>
                <p>Moedas</p>
              </div>
            </IonCol>
            <IonCol size="6">
              <div className="stat-card">
                <div className="icon-box blue"><IonIcon icon={timeOutline} /></div>
                <h3>0s</h3>
                <p>Tempo Médio</p>
              </div>
            </IonCol>
            <IonCol size="6">
              <div className="stat-card">
                <div className="icon-box red"><IonIcon icon={flameOutline} /></div>
                <h3>#42</h3>
                <p>Posição Global</p>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* 3. PROGRESSO */}
        <div className="progress-card section-margin">
          <div className="progress-header">
            <strong>Progresso de Nível</strong>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <IonProgressBar value={progress} color="success" className="custom-progress"></IonProgressBar>
          <p className="small-text">XP: {xp}</p>
        </div>

        {/* 4. BOTÃO DE SAIR */}
        <div className="section-margin" style={{ marginTop: '30px' }}>
          <IonButton expand="block" className="logout-btn" onClick={handleLogout}>
            <IonIcon slot="start" icon={logOutOutline} />
            Sair da Conta
          </IonButton>
        </div>

        <div style={{ height: '80px' }}></div>

      </IonContent>
    </IonPage>
  );
};

export default Profile;