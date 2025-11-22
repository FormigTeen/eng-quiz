import React from 'react';
import {
  IonContent, IonPage, IonIcon, IonButton,
  IonGrid, IonRow, IonCol
} from '@ionic/react';
import {
  alertCircleOutline, gameControllerOutline,
  trophyOutline, giftOutline, walletOutline
} from 'ionicons/icons';
import './Shop.css';

const Shop: React.FC = () => {

  // Lista de Pacotes de Moedas
  const packages = [
    {
      id: 1,
      name: 'Iniciante',
      coins: '500',
      total: '500',
      bonus: null,
      price: 'R$ 9,90',
      bestSeller: false
    },
    {
      id: 2,
      name: 'Intermediário',
      coins: '1.200',
      total: '1.400',
      bonus: '+200 BÔNUS',
      price: 'R$ 24,90',
      bestSeller: true // Esse booleano ativa a borda verde
    },
  ];

  return (
    <IonPage>
      <IonContent fullscreen className="shop-bg">

        {/* 1. CARD DE SALDO (LARANJA) */}
        <div className="section-padding">
          <div className="balance-card">
            <div className="money-bag">💰</div>
            <p>Seu Saldo Atual</p>
            <h1>1250</h1>
            <span>moedas disponíveis</span>
          </div>
        </div>

        {/* 2. AVISO PIX */}
        <div className="section-padding pt-0">
          <div className="pix-info">
            <IonIcon icon={alertCircleOutline} />
            <div>
              <strong>Pagamento Seguro via PIX</strong>
              <p>Compre moedas de forma rápida e segura. Após o pagamento, suas moedas caem na hora.</p>
            </div>
          </div>
        </div>

        {/* 3. LISTA DE PACOTES */}
        <div className="section-header-shop">
          <h3>Escolha seu Pacote</h3>
          <p>Quanto maior o pacote, mais bônus você ganha!</p>
        </div>

        <div className="section-padding">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`package-card ${pkg.bestSeller ? 'best-seller-border' : ''}`}>

              {pkg.bestSeller && <div className="best-seller-badge">Mais Vendido</div>}

              <span className="pkg-name">{pkg.name}</span>

              {/* Ícone de Moeda Simulado */}
              <div className="coin-image-circle">
                <div className="inner-coin"></div>
              </div>

              <h2>{pkg.coins}</h2>

              {pkg.bonus && (
                <div className="bonus-tag">
                  <IonIcon icon={walletOutline} /> {pkg.bonus}
                </div>
              )}

              <p className="pkg-desc">Você recebe:<br /><strong>{pkg.total}</strong><br />moedas no total</p>

              <div className="price-box">
                <small>Por apenas</small>
                <h3>{pkg.price}</h3>
              </div>

              <IonButton expand="block" className="shop-btn">
                <IonIcon slot="start" icon={walletOutline} />
                Comprar Agora
              </IonButton>
            </div>
          ))}
        </div>

        {/* 4. O QUE FAZER COM AS MOEDAS */}
        <div className="white-container-bottom">
          <div className="section-header-shop text-center">
            <h3>O que você pode fazer com suas moedas?</h3>
            <p>Aproveite ao máximo sua experiência no Soccer Quiz</p>
          </div>

          <div className="feature-card purple-feat">
            <IonIcon icon={gameControllerOutline} />
            <h4>Criar Quiz Premiado</h4>
            <p>Organize quizzes com prêmios em moedas para seus amigos</p>
          </div>

          <div className="feature-card yellow-feat">
            <IonIcon icon={trophyOutline} />
            <h4>Participar de Torneios</h4>
            <p>Entre em competições emocionantes com grandes prêmios</p>
          </div>

          <div className="feature-card green-feat">
            <IonIcon icon={giftOutline} />
            <h4>Desbloquear Categorias</h4>
            <p>Acesse categorias especiais e conteúdo premium exclusivo</p>
          </div>

          {/* Espaço extra para não cortar o final */}
          <div style={{ height: '60px' }}></div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Shop;