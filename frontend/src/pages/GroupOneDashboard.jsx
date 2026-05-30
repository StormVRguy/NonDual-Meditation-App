import Dashboard from './Dashboard'

function GroupOneIntro() {
  return (
    <div className="daily-practices">
      <h3>Materiale quotidiano</h3>
      <h3 style={{ color: 'red' }}>Recupera sempre la lezione entro il giorno successivo se non hai partecipato in presenza.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Praticare ogni giorno seguendo la traccia audio.
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>: Possiamo provare a mantenere una relativa continuità di presenza durante le attività quotidiane, rafforzando la particolare forma di consapevolezza che stiamo scoprendo e coltivando nella pratica formale - la quale potrebbe essere descritta come lo &quot;spazio&quot; entro il quale sorgono e svaniscono i vari fenomeni dell&apos;esperienza, e che in ultima analisi non è neppure distinguibile da questi ultimi.
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
