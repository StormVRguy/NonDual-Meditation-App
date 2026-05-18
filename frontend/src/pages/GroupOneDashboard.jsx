import Dashboard from './Dashboard'

function GroupOneIntro() {
  return (
    <div className="daily-practices">
      <h3>Materiale quotidiano</h3>
      <h3 style={{ color: 'red' }}>Recupera sempre la lezione entro il giorno successivo se non hai partecipato in presenza.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Meditare quotidianamente in posizione seduta seguendo l&apos;ultima traccia audio.
        </li>
        <li>
          <strong>TASK CONTEMPLATIVO</strong>: Qualche volta provare ad addormentarsi osservando la mente, proprio come facciamo in meditazione, ma senza contrastare il processo di addormentamento. Meglio se questa esplorazione è svolta in una delle seguenti circostanze: dopo un risveglio notturno; al mattino; oppure di pomeriggio. Ciò ha due scopi:
          <ul>
            <li>
              È di per sé interessante osservare la mente durante lo stato in cui i sensi sono quasi sopiti e le forme consuete di attività mentale cedono il passo a processi interiori più vividi e bizzarri – benché non facili da contemplare senza perdere coscienza.
            </li>
            <li>
              Questa attività potrebbe condurre, senza ulteriori pratiche, a sperimentare sogni lucidi (o comunque sogni più vividi e consapevoli del consueto), associati a questo tipo di meditazioni in varie fonti contemplative.
            </li>
          </ul>
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>: Provare ad accorgersi se, nella vita di tutti i giorni, si riesce a essere più consapevoli dei propri processi interiori, quasi come se questi venissero percepiti attraverso un senso interno. Riusciamo a sperimentare una relativa continuità di consapevolezza? Abbiamo l&apos;impressione che in tal modo si riduca il senso di identificazione con i contenuti e processi mentali più intensi e/o se ne limiti la durata?
        </li>
      </ul>
    </div>
  )
}

function GroupOneDashboard({ onLogout }) {
  return (
    <Dashboard
      onLogout={onLogout}
      pageTitle="Dashboard del Corso di Meditazione Non Duale"
      introContent={<GroupOneIntro />}
      showBodyScanMeditation={false}
    />
  )
}

export default GroupOneDashboard
