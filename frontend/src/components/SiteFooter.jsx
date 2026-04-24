import './SiteFooter.css'

function SiteFooter({ showMeditationContact = false }) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">
        <p className="site-footer-line">
          Sito di ricerca dell’<strong>Università di Trento (UniTN)</strong> per uno{' '}
          <strong>studio sulla meditazione non duale</strong>.
        </p>
        <p className="site-footer-line site-footer-contacts">
          <span className="site-footer-contact-item">
            <strong>Informazioni sullo studio</strong>:{' '}
            <a href="mailto:erdem.taskiran@unitn.it">erdem.taskiran@unitn.it</a>
          </span>
          <span className="site-footer-contact-item">
            <strong>Sito / questionario online</strong>:{' '}
            <a href="mailto:andrea.signorelli@unitn.it">andrea.signorelli@unitn.it</a>
          </span>
          {showMeditationContact ? (
            <span className="site-footer-contact-item">
              <strong>Meditazione / pratiche di riduzione del rischio</strong>:{' '}
              <a href="mailto:c.mascarello@centrostudiubi.it">c.mascarello@centrostudiubi.it</a>
            </span>
          ) : null}
        </p>
      </div>
    </footer>
  )
}

export default SiteFooter
