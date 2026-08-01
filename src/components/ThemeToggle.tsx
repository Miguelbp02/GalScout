import { useTheme } from '../hooks/useTheme'

function ThemeToggle() {
  const { tema, alternarTema } = useTheme()
  const esOscuro = tema === 'dark'

  return (
    <button
      aria-label={esOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-pressed={!esOscuro}
      className="theme-toggle"
      title={esOscuro ? 'Modo oscuro activado' : 'Modo claro activado'}
      type="button"
      onClick={alternarTema}
    >
      <span aria-hidden="true" className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
      </span>
      <span className="visually-hidden">{esOscuro ? 'Modo oscuro activado' : 'Modo claro activado'}</span>
    </button>
  )
}

export default ThemeToggle
