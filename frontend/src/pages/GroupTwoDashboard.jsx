import Dashboard from './Dashboard'

function GroupTwoIntro() {
  return (
    <div className="daily-practices">
      <h3 style={{ color: 'red' }}>Se salti una sessione in presenza, completa il recupero video entro il giorno successivo.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Ogni giorno, praticare la meditazione seduta sul respiro, seguendo la traccia audio. Talvolta (massimo due volte) è possibile sostituirla con la meditazione distesa del body-scan, seguendo la traccia audio.
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>: Durante la giornata, concedersi qualche momento di consapevolezza – 2 o 3 minuti, anche più volte – per lasciare andare ogni pensiero e attività, e prendere consapevolezza di corpo, respiro, stato d’animo e ambiente circostante. È importante concentrarsi sull’atteggiamento di ascolto, cura e disponibilità verso la propria condizione (interna ed esterna). Si suggerisce anche di usare il respiro come asse attorno al quale «radunare la consapevolezza», dando così continuità alla pratica formale.
        </li>
        <li>
          <strong>TASK CONTEMPLATIVO</strong>: Prova a interrogarti sulla natura dei fenomeni dischiusi dalla percezione, come suoni e colori: dove hanno luogo veramente? Prova a porti seriamente questa domanda, esplorandone le possibili risposte e le relative implicazioni. Non limitarti a una riflessione intellettuale: scopri se questo genere di indagine ha un impatto sul modo in cui concepisci la realtà che ti circonda.
        </li>
      </ul>
    </div>
  )
}

function GroupTwoDashboard({ onLogout }) {
  return (
    <Dashboard
      onLogout={onLogout}
      pageTitle="Dashboard del Corso di Meditazione Non Duale"
      introContent={<GroupTwoIntro />}
      questionnaireSurveyUrl={import.meta.env.VITE_QUALTRICS_SURVEY_URL_2}
    />
  )
}

export default GroupTwoDashboard
