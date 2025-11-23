import React, { useState } from 'react';
import {
  IonContent, IonPage, IonIcon, IonButton,
  IonGrid, IonRow, IonCol, IonToggle, IonLabel
} from '@ionic/react';
import {
  notificationsOutline, filterOutline, checkmarkDoneOutline,
  trashOutline, locateOutline, trophyOutline, peopleOutline,
  flashOutline, giftOutline, settingsOutline, chevronForwardOutline
} from 'ionicons/icons';
import './Notifications.css';

const Notifications: React.FC = () => {

  // Simulação de Dados das Notificações
  const notificationsList = [
    {
      id: 1,
      title: 'Novo Quiz Disponível!',
      desc: 'Quiz sobre Brasileirão 2024 está disponível. Mostre seu conhecimento!',
      time: 'Há 5 minutos',
      new: true,
      type: 'quiz',
      icon: locateOutline,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Você subiu no ranking!',
      desc: 'Parabéns! Você subiu 5 posições e agora está em #42',
      time: 'Há 1 hora',
      new: true,
      type: 'ranking',
      icon: trophyOutline,
      color: 'orange'
    },
    {
      id: 3,
      title: 'Novo amigo adicionado',
      desc: 'Carlos Mendes aceitou seu convite! Desafie-o para um quiz.',
      time: 'Há 2 horas',
      new: true,
      type: 'friend',
      icon: peopleOutline,
      color: 'green'
    },
    {
      id: 4,
      title: 'Desafio Recebido',
      desc: 'Maria Santos te desafiou para um quiz sobre Copas do Mundo',
      time: 'Ontem',
      new: false,
      type: 'challenge',
      icon: flashOutline,
      color: 'orange-red'
    },
    {
      id: 5,
      title: 'Bem-vindo ao Quiz Futebol!',
      desc: 'Complete seu perfil e ganhe 50 créditos grátis',
      time: '2 dias atrás',
      new: false,
      type: 'gift',
      icon: giftOutline,
      color: 'pink'
    },
  ];

  return (
    <IonPage>
      <IonContent fullscreen className="notif-bg">

        {/* 1. CABEÇALHO DA CENTRAL */}
        <div className="section-padding">
          <div className="header-card">
            <div className="header-icon-box">
              <IonIcon icon={notificationsOutline} />
            </div>
            <div className="header-info">
              <h3>Central de Notificações</h3>
              <p>3 novas notificações</p>
            </div>
            <div className="counter-box">
              <div className="c-item border-right">
                <span>Total</span>
                <strong>7</strong>
              </div>
              <div className="c-item">
                <span>Lidas</span>
                <strong>4</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FILTROS E AÇÕES */}
        <div className="section-padding pt-0">
          <div className="filter-label">
            <IonIcon icon={filterOutline} />
            <div>
              <strong>Filtros</strong>
              <p>Organize suas notificações</p>
            </div>
          </div>

          <div className="filter-row">
            <button className="pill-btn active">
              <IonIcon icon={notificationsOutline} /> Todas (7)
            </button>
            <div className="unread-badge">
              <span className="dot"></span> 3 Não Lidas
            </div>
          </div>

          <div className="action-row">
            <button className="action-btn green">
              <IonIcon icon={checkmarkDoneOutline} /> Marcar Todas
            </button>
            <button className="action-btn red-outline">
              <IonIcon icon={trashOutline} /> Limpar Lidas
            </button>
          </div>
        </div>

        {/* 3. LISTA DE NOTIFICAÇÕES */}
        <div className="section-padding pt-0">
          <h4 className="list-title">
            <IonIcon icon={notificationsOutline} /> Todas as Notificações
            <small>7 notificações</small>
          </h4>

          {notificationsList.map((item) => (
            <div key={item.id} className={`notif-card ${item.new ? 'is-new' : ''}`}>

              {/* Faixa lateral verde (só se for novo) */}
              {item.new && <div className="green-stripe"></div>}

              <div className="notif-content">
                <div className={`n-icon-box ${item.color}`}>
                  <IonIcon icon={item.icon} />
                </div>

                <div className="n-text">
                  <div className="n-header">
                    <h3>{item.title}</h3>
                    {item.new && <span className="new-badge">NOVO</span>}
                  </div>
                  <p>{item.desc}</p>
                  <span className="time-text">• {item.time}</span>
                </div>
              </div>

              {/* Ícone pequeno na direita indicando o tipo */}
              <div className="right-type-icon">
                <IonIcon icon={item.icon} />
              </div>
            </div>
          ))}
        </div>

        {/* 4. PREFERÊNCIAS (CONFIGURAÇÕES) */}
        <div className="section-padding pt-0 pb-100">
          <div className="filter-label mt-4">
            <IonIcon icon={settingsOutline} className="orange-text" />
            <div>
              <strong>Preferências</strong>
              <p>Gerencie os tipos de notificações que você recebe</p>
            </div>
          </div>

          <div className="pref-card">
            <div className="pref-item">
              <div className="pref-icon blue-light"><IonIcon icon={notificationsOutline} /></div>
              <div className="pref-text">
                <strong>Novos Quizzes</strong>
                <p>Notificações de quizzes disponíveis</p>
              </div>
              <IonToggle checked={true} mode="ios" />
            </div>

            <div className="pref-item">
              <div className="pref-icon yellow-light"><IonIcon icon={trophyOutline} /></div>
              <div className="pref-text">
                <strong>Ranking</strong>
                <p>Atualizações de posição no ranking</p>
              </div>
              <IonToggle checked={true} color="warning" mode="ios" />
            </div>

            <div className="pref-item">
              <div className="pref-icon green-light"><IonIcon icon={peopleOutline} /></div>
              <div className="pref-text">
                <strong>Amigos</strong>
                <p>Convites e desafios de amigos</p>
              </div>
              <IonToggle checked={true} color="success" mode="ios" />
            </div>

            <div className="pref-item no-border">
              <div className="pref-icon purple-light"><IonIcon icon={giftOutline} /></div>
              <div className="pref-text">
                <strong>Conquistas</strong>
                <p>Notificações de conquistas desbloqueadas</p>
              </div>
              <IonToggle checked={true} color="tertiary" mode="ios" />
            </div>
          </div>

          {/* Espaço extra para não cortar */}
          <div style={{ height: '60px' }}></div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Notifications;