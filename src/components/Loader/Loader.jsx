import './Loader.css'

function Loader({ text = 'Loading', variant = 'large' }) {
  return (
    <div className={`loader ${variant === 'small' ? 'loader--small' : ''}`} role="status" aria-label={text}>
      <span className="loader__spinner" />
      {text ? <span className="loader__text">{text}</span> : null}
    </div>
  )
}

export default Loader
