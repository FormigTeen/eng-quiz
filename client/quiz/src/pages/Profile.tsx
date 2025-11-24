import React from 'react';
import {
  IonContent, IonPage, IonAvatar, IonButton, IonIcon,
  IonGrid, IonRow, IonCol, IonProgressBar, IonLabel
} from '@ionic/react';
import {
  createOutline, personCircleOutline, ribbonOutline,
  flameOutline, timeOutline, statsChartOutline
} from 'ionicons/icons';
import './Profile.css';
import { useAuth } from '../hooks/useAuth';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const level = user?.level ?? 1;
  const coins = user?.wallet?.credits ?? 0;
  const xp = user?.xp ?? 0;
  const progress = Math.min((xp % 100) / 100, 1);
  const badges = user?.badges || [];
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
            <div className="input-group">
              <IonLabel>Nome Completo</IonLabel>
              <div className="fake-input">
                <span className="muted">Não Disponível</span>
                <IonIcon icon={createOutline} />
              </div>
            </div>

            <div className="input-group">
              <IonLabel>Email</IonLabel>
              <div className="fake-input">
                <span>{user?.email || '—'}</span>
                <IonIcon icon={createOutline} />
              </div>
            </div>
          </div>
        </div>

        {/* 2. ESTATÍSTICAS (GRID 2x2) */}
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

        {/* 4. CONQUISTAS */}
        <div className="section-title">Conquistas</div>

        <div className="achievements-scroll">
          {badges.map((b, i) => (
            <div className="achievement-card unlocked" key={i}>
              <IonIcon icon={b.iconUrl ? undefined : medalOutline} className="ach-icon" />
              <h4>{b.title}</h4>
              <p>{b.description || '—'}</p>
              <div className="status">✔ Desbloqueada</div>
            </div>
          ))}
          <div className="achievement-card locked">
            <IonIcon icon={personCircleOutline} className="ach-icon" />
            <h4>Lendário</h4>
            <p>Alcance o nível 50</p>
            <div className="status lock">Bloqueada</div>
          </div>
        </div>

        {/* Espaço extra para não ficar escondido pela TabBar */}
        <div style={{ height: '80px' }}></div>

      </IonContent>
    </IonPage>
  );
};

export default Profile;
