import { useEffect, useId, useState, type FormEvent } from 'react'
import { obtenerTemporadasRecientes } from '../constants/temporadas'
import { GRUPOS_PROVINCIA, LIGAS_POR_CATEGORIA, ligaTieneGrupoProvincial } from '../constants/ligasFutbol'
import { obtenerEquipos } from '../services/teamService'
import type { CategoriaJugador } from '../types/jugador'
import type { HistorialEquipoJugador, NuevoHistorialEquipo } from '../types/historialEquipo'
import { useToast } from './ToastContext'

interface TeamHistoryFormProps {
  onCrearHistorial: (historial: NuevoHistorialEquipo) => Promise<void>
  onActualizarHistorial?: (id: string, historial: NuevoHistorialEquipo) => Promise<void>
  historial?: HistorialEquipoJugador[]
  textoBoton?: string
  mensajeExito?: string
}

const temporadasRecientes = obtenerTemporadasRecientes()
const TEMPORADA_ACTUAL = temporadasRecientes[0]

function TeamHistoryForm({
  onCrearHistorial,
  onActualizarHistorial,
  historial = [],
  textoBoton = 'Añadir al historial',
  mensajeExito = 'Etapa añadida al historial',
}: TeamHistoryFormProps) {
  const idListaEquipos = useId()
  const [nombresEquipos, setNombresEquipos] = useState<string[]>([])
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [temporada, setTemporada] = useState(TEMPORADA_ACTUAL)
  const [categoria, setCategoria] = useState<CategoriaJugador | ''>('')
  const [liga, setLiga] = useState('')
  const [grupoProvincia, setGrupoProvincia] = useState('')
  const [marcarComoActual, setMarcarComoActual] = useState(true)
  const [dorsal, setDorsal] = useState('')
  const [goles, setGoles] = useState('')
  const [partidos, setPartidos] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const { mostrarToast } = useToast()

  const ligasDisponibles = categoria ? LIGAS_POR_CATEGORIA[categoria] : []
  const esTemporadaActual = temporada === TEMPORADA_ACTUAL
  const necesitaGrupoProvincia = ligaTieneGrupoProvincial(liga)
  const etapaCoincidente = historial.find((etapa) => etapa.temporada === temporada) ?? null

  useEffect(() => {
    obtenerEquipos()
      .then((equipos) => setNombresEquipos(equipos.map((equipo) => equipo.nombre)))
      .catch(() => setNombresEquipos([]))
  }, [])

  useEffect(() => {
    const coincidencia = historial.find((etapa) => etapa.temporada === temporada)

    if (coincidencia) {
      setNombreEquipo(coincidencia.equipoNombre)
      setCategoria(coincidencia.categoria ?? '')
      setLiga(coincidencia.liga ?? '')
      setGrupoProvincia(coincidencia.grupoProvincia ?? '')
      setDorsal(coincidencia.dorsal !== null ? String(coincidencia.dorsal) : '')
      setGoles(coincidencia.goles !== null ? String(coincidencia.goles) : '')
      setPartidos(coincidencia.partidos !== null ? String(coincidencia.partidos) : '')
      setNotas(coincidencia.notas)
      setMarcarComoActual(coincidencia.esActual)
    } else {
      setNombreEquipo('')
      setCategoria('')
      setLiga('')
      setGrupoProvincia('')
      setDorsal('')
      setGoles('')
      setPartidos('')
      setNotas('')
      setMarcarComoActual(true)
    }
    // Solo queremos releer el historial cuando cambia la temporada elegida
    // (o llega el historial por primera vez), no en cada tecleo del resto de campos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temporada, historial])

  function limpiarFormulario() {
    setNombreEquipo('')
    setTemporada(TEMPORADA_ACTUAL)
    setCategoria('')
    setLiga('')
    setGrupoProvincia('')
    setMarcarComoActual(true)
    setDorsal('')
    setGoles('')
    setPartidos('')
    setNotas('')
  }

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const nombreLimpio = nombreEquipo.trim()

    if (!nombreLimpio) {
      setError('Indica el nombre del equipo.')
      return
    }

    setError(null)
    setGuardando(true)

    const datos: NuevoHistorialEquipo = {
      nombreEquipo: nombreLimpio,
      temporada,
      categoria,
      liga,
      grupoProvincia: necesitaGrupoProvincia ? grupoProvincia : '',
      dorsal: dorsal.trim() === '' ? null : Number(dorsal),
      goles: goles.trim() === '' ? null : Number(goles),
      partidos: partidos.trim() === '' ? null : Number(partidos),
      notas,
      marcarComoActual: esTemporadaActual && marcarComoActual,
    }

    try {
      const coincidencia = historial.find((etapa) => etapa.temporada === temporada)

      if (coincidencia && onActualizarHistorial) {
        await onActualizarHistorial(coincidencia.id, datos)
        mostrarToast(`Etapa de ${temporada} actualizada`)
      } else {
        await onCrearHistorial(datos)
        mostrarToast(mensajeExito)
      }

      limpiarFormulario()
    } catch {
      setError('No se ha podido guardar la etapa en el historial.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviarFormulario}>
      {etapaCoincidente && (
        <p className="alert alert-info py-2 mb-3" role="status">
          Ya hay una etapa guardada en {temporada} ({etapaCoincidente.equipoNombre}). Vas a
          modificar ese registro, no a crear uno nuevo.
        </p>
      )}

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="historial-equipo">
            Equipo
          </label>
          <input
            className="form-control"
            disabled={guardando}
            id="historial-equipo"
            list={idListaEquipos}
            placeholder="Nombre del equipo"
            required
            type="text"
            value={nombreEquipo}
            onChange={(evento) => setNombreEquipo(evento.target.value)}
          />
          <datalist id={idListaEquipos}>
            {nombresEquipos.map((nombre) => (
              <option key={nombre} value={nombre} />
            ))}
          </datalist>
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="historial-temporada">
            Temporada
          </label>
          <select
            className="form-select"
            disabled={guardando}
            id="historial-temporada"
            value={temporada}
            onChange={(evento) => setTemporada(evento.target.value)}
          >
            {temporadasRecientes.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label" htmlFor="historial-categoria">
            Categoría <span className="text-body-secondary">*</span>
          </label>
          <select
            className="form-select"
            disabled={guardando}
            id="historial-categoria"
            value={categoria}
            onChange={(evento) => {
              const nuevaCategoria = evento.target.value as CategoriaJugador | ''
              setCategoria(nuevaCategoria)
              setLiga('')
              setGrupoProvincia('')
            }}
          >
            <option value="">Sin indicar</option>
            <option value="Senior">Senior</option>
            <option value="Juvenil">Juvenil</option>
            <option value="Cadete">Cadete</option>
          </select>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label" htmlFor="historial-liga">
            Liga <span className="text-body-secondary">*</span>
          </label>
          <select
            className="form-select"
            disabled={guardando || !categoria}
            id="historial-liga"
            value={liga}
            onChange={(evento) => {
              setLiga(evento.target.value)
              setGrupoProvincia('')
            }}
          >
            <option value="">{categoria ? 'Sin indicar' : 'Elige antes la categoría'}</option>
            {ligasDisponibles.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </div>

        {necesitaGrupoProvincia && (
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="historial-grupo-provincia">
              Grupo / provincia <span className="text-body-secondary">*</span>
            </label>
            <select
              className="form-select"
              disabled={guardando}
              id="historial-grupo-provincia"
              value={grupoProvincia}
              onChange={(evento) => setGrupoProvincia(evento.target.value)}
            >
              <option value="">Sin indicar</option>
              {GRUPOS_PROVINCIA.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="col-6 col-md-3">
          <label className="form-label" htmlFor="historial-dorsal">
            Dorsal <span className="text-body-secondary">*</span>
          </label>
          <input
            className="form-control"
            disabled={guardando}
            id="historial-dorsal"
            inputMode="numeric"
            max={99}
            min={1}
            placeholder="Sin datos"
            type="number"
            value={dorsal}
            onChange={(evento) => setDorsal(evento.target.value)}
          />
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label" htmlFor="historial-goles">
            Goles <span className="text-body-secondary">*</span>
          </label>
          <input
            className="form-control"
            disabled={guardando}
            id="historial-goles"
            inputMode="numeric"
            min={0}
            placeholder="Sin datos"
            type="number"
            value={goles}
            onChange={(evento) => setGoles(evento.target.value)}
          />
        </div>

        <div className="col-6 col-md-3">
          <label className="form-label" htmlFor="historial-partidos">
            Partidos <span className="text-body-secondary">*</span>
          </label>
          <input
            className="form-control"
            disabled={guardando}
            id="historial-partidos"
            inputMode="numeric"
            min={0}
            placeholder="Sin datos"
            type="number"
            value={partidos}
            onChange={(evento) => setPartidos(evento.target.value)}
          />
        </div>

        <div className="col-12">
          <label className="form-label" htmlFor="historial-notas">
            Notas <span className="text-body-secondary">*</span>
          </label>
          <textarea
            className="form-control"
            disabled={guardando}
            id="historial-notas"
            placeholder="Contexto de la etapa: rol, motivo de salida, cesión..."
            rows={3}
            value={notas}
            onChange={(evento) => setNotas(evento.target.value)}
          />
        </div>

        {esTemporadaActual && (
          <div className="col-12">
            <div className="form-check">
              <input
                checked={marcarComoActual}
                className="form-check-input"
                disabled={guardando}
                id="historial-marcar-actual"
                type="checkbox"
                onChange={(evento) => setMarcarComoActual(evento.target.checked)}
              />
              <label className="form-check-label" htmlFor="historial-marcar-actual">
                Marcar como equipo actual del jugador
              </label>
            </div>
          </div>
        )}
      </div>

      <p className="small text-body-secondary mt-2 mb-0">* Campo opcional</p>

      {error && (
        <p className="alert alert-danger py-2 mt-3 mb-0" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary mt-3" disabled={guardando} type="submit">
        {guardando
          ? 'Guardando…'
          : etapaCoincidente
            ? 'Guardar cambios en la etapa'
            : textoBoton}
      </button>
    </form>
  )
}

export default TeamHistoryForm
