import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { personAddOutline } from 'ionicons/icons';
import './TopRightBar.css';

type Props = {
  coins: number;
  onInvite: () => void;
  sticky?: boolean;
};

const TopRightBar: React.FC<Props> = ({ coins, onInvite, sticky }) => {
  return (
    <div className={`trb-container ${sticky ? 'trb-sticky' : ''}`}>
      <div className="trb-coin">🟡 {coins}</div>
      <IonButton size="small" className="trb-invite" onClick={onInvite}>
        <IonIcon slot="start" icon={personAddOutline} />
        CONVIDAR
      </IonButton>
    </div>
  );
};

export default TopRightBar;
