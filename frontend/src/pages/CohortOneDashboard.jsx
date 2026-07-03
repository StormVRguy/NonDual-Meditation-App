import Dashboard from './Dashboard'
import { dashboardFeatures } from '../config/dashboardFeatures'
import { qualtricsSurveyUrls } from '../config/qualtricsSurveyUrls'

function CohortOneIntro() {
  return (
    <div className="daily-practices">
      <h3 style={{ color: 'red' }}>Recupera sempre la lezione entro il giorno successivo se non hai partecipato in diretta.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Praticare la meditazione seguendo la traccia audio, ogni giorno.
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>
          <p>
            Quando durante le tue giornate ti capita di ricordarti di questa possibilità, prenditi qualche momento per ritornare a una condizione di maggiore focalizzazione e presenza, percependo il flusso dell&apos;aria che entra ed esce dalle narici, con la massima chiarezza e intensità di cui sei capace e lasciando che tutto il resto, almeno per qualche tempo, rimanga sullo sfondo.
          </p>
          <p>
            Nota se per caso, anche quando non ci pensi esplicitamente, la consapevolezza del corpo e del respiro che stai coltivando si sta trasformando in una qualità di fondo dell&apos;esperienza, che ti aiuta a mantenere un senso di radicamento e contatto con il presente e con te stessa/o.
          </p>
        </li>
      </ul>
    </div>
  )
}

function CohortOneDashboard({ onLogout }) {
  return (
    <Dashboard
      onLogout={onLogout}
      pageTitle="Dashboard del Corso di Meditazione Non Duale"
      introContent={<CohortOneIntro />}
      {...dashboardFeatures.coreOnly}
      useDefaultQualtricsUrl={false}
      questionnaireSurveyUrl={qualtricsSurveyUrls.cohortOne}
    />
  )
}

export default CohortOneDashboard
