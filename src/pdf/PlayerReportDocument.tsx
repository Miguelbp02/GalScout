import {
  Circle,
  Document,
  G,
  Image,
  Line,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'
import playerPlaceholder from '../assets/player-placeholder.png'
import logoAppOjeoSquare from '../assets/logoAppOjeo-square.png'
import {
  ZONAS_CAMPO_POSICION,
  obtenerGeometriaZonaPosicion,
} from '../constants/positionFieldLayout'
import {
  calcularConteos,
  calcularPares,
  calcularZonas,
  filtrarAccionesDeJuego,
  normalizarX,
  normalizarY,
} from '../services/playerStatsService'
import type { AccionObservacionDePartido } from '../types/accionObservacion'
import type { PerfilScouting } from '../types/criterio'
import type { ConfiguracionInformeJugador, ConfiguracionMapaInforme } from '../types/exportacionJugador'
import type { Jugador } from '../types/jugador'
import type { ObservacionJugador } from '../types/observacion'
import type { Posicion } from '../types/posicion'
import type { ValoracionGeneral } from '../types/valoracionGeneral'

export interface DatosInformeJugador {
  jugador: Jugador
  posiciones: Posicion[]
  posicionesNaturalesIds: number[]
  posicionesAptasIds: number[]
  perfilScouting: PerfilScouting
  acciones: AccionObservacionDePartido[]
  observaciones: ObservacionJugador[]
  valoracionesGenerales: ValoracionGeneral[]
  configuracion: ConfiguracionInformeJugador
  /** Solo se sobrescribe en pruebas; la app usa el placeholder empaquetado. */
  imagenJugadorSrc?: string
  logoSrc?: string
}

const COLORES = {
  fondo: '#dce7ef',
  superficie: '#ffffff',
  texto: '#16202a',
  tenue: '#5b6874',
  borde: '#cfdbe4',
  verde: '#2e7558',
  verdeMarca: '#61a96b',
  verdeSuave: '#e1f0e5',
  azul: '#23577d',
  azulMarca: '#4d83b5',
  azulSuave: '#e2ecf5',
  azulOscuro: '#123b5c',
  rojo: '#bd4b4b',
  rojoSuave: '#f7e4e4',
  campo: '#214f3a',
  lineaCampo: '#d5e8dd',
  posicionNatural: '#3be8c8',
  posicionApta: '#c9f227',
}

const styles = StyleSheet.create({
  pagina: {
    backgroundColor: COLORES.fondo,
    color: COLORES.texto,
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.35,
    paddingBottom: 54,
    paddingHorizontal: 34,
    paddingTop: 26,
  },
  haloVerde: {
    backgroundColor: '#b7ddc2',
    borderRadius: 150,
    height: 300,
    opacity: 0.82,
    position: 'absolute',
    right: -95,
    top: -105,
    width: 300,
  },
  haloAzul: {
    backgroundColor: '#b8d1e5',
    borderRadius: 180,
    bottom: -135,
    height: 360,
    left: -125,
    opacity: 0.78,
    position: 'absolute',
    width: 360,
  },
  marca: {
    alignItems: 'center',
    backgroundColor: COLORES.azulOscuro,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 14,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  marcaLinea: {
    backgroundColor: COLORES.verdeMarca,
    bottom: 0,
    height: 3,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  logoCrop: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 52,
  },
  logoMarca: {
    height: 46,
    objectFit: 'contain',
    width: 46,
  },
  marcaNombre: { alignItems: 'center', display: 'flex', flexDirection: 'row', height: 23 },
  marcaGal: { color: COLORES.verdeMarca, fontFamily: 'Helvetica-Bold', fontSize: 22, lineHeight: 1 },
  marcaScout: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 22, lineHeight: 1 },
  marcaTexto: { flexGrow: 1, justifyContent: 'center', paddingLeft: 12 },
  marcaSubtitulo: { color: '#b9cbda', fontSize: 7, letterSpacing: 0.65, marginTop: 4, textTransform: 'uppercase' },
  documentoIdentidad: { alignItems: 'flex-end', maxWidth: 205 },
  documentoTipo: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 3, textTransform: 'uppercase' },
  documentoMeta: { color: '#b9cbda', fontSize: 7.5, textAlign: 'right' },
  cabeceraAcento: {
    backgroundColor: COLORES.verdeMarca,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 5,
  },
  cabecera: {
    backgroundColor: COLORES.superficie,
    borderColor: COLORES.borde,
    borderRadius: 9,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 18,
    overflow: 'hidden',
    padding: 16,
    paddingLeft: 19,
  },
  avatarMarco: {
    alignItems: 'center',
    backgroundColor: COLORES.verdeSuave,
    borderColor: '#c3ddca',
    borderRadius: 42,
    borderWidth: 2,
    height: 82,
    justifyContent: 'center',
    width: 82,
  },
  avatar: { borderRadius: 37, height: 74, objectFit: 'cover', width: 74 },
  identidad: { flexGrow: 1, paddingHorizontal: 14 },
  nombre: { fontFamily: 'Helvetica-Bold', fontSize: 19, marginBottom: 7 },
  estado: {
    alignSelf: 'flex-start',
    backgroundColor: COLORES.verdeSuave,
    borderRadius: 8,
    color: COLORES.verde,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    marginBottom: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  datos: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap' },
  dato: { marginBottom: 6, width: '50%' },
  datoEtiqueta: { color: COLORES.tenue, fontSize: 7, marginBottom: 1, textTransform: 'uppercase' },
  datoValor: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  posicion: { alignItems: 'center', width: 128 },
  posicionTitulo: { color: COLORES.tenue, fontFamily: 'Helvetica-Bold', fontSize: 7, marginBottom: 4, textTransform: 'uppercase' },
  posicionLeyenda: { display: 'flex', flexDirection: 'row', marginTop: 4 },
  posicionLeyendaItem: { alignItems: 'center', display: 'flex', flexDirection: 'row', marginHorizontal: 4 },
  posicionLeyendaPunto: { borderRadius: 2, height: 5, marginRight: 3, width: 5 },
  posicionLeyendaTexto: { color: COLORES.tenue, fontSize: 5.5 },
  seccion: {
    backgroundColor: COLORES.superficie,
    borderColor: COLORES.borde,
    borderRadius: 7,
    borderWidth: 1,
    borderTopColor: COLORES.azulMarca,
    borderTopWidth: 2,
    marginBottom: 13,
    padding: 13,
  },
  seccionTitulo: { fontFamily: 'Helvetica-Bold', fontSize: 13, marginBottom: 3 },
  seccionAyuda: { color: COLORES.tenue, fontSize: 8, marginBottom: 10 },
  filaRatio: { marginBottom: 9 },
  filaCabecera: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  filaTitulo: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  filaValor: { color: COLORES.verde, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  pista: { backgroundColor: '#e9efeb', borderRadius: 3, height: 5, overflow: 'hidden' },
  relleno: { backgroundColor: COLORES.verde, borderRadius: 3, height: 5 },
  detalle: { color: COLORES.tenue, fontSize: 7, marginTop: 2 },
  repertorioColumnas: { display: 'flex', flexDirection: 'row' },
  repertorioColumna: { flexGrow: 1, width: '50%' },
  repertorioColumnaPrimera: { marginRight: 12 },
  subtitulo: { fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 6 },
  repertorioFila: {
    borderBottomColor: COLORES.borde,
    borderBottomWidth: 0.5,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  repertorioNombre: { fontSize: 8, maxWidth: '80%' },
  repertorioTotal: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  mapaContenido: { display: 'flex', flexDirection: 'row' },
  mapaCampo: { alignItems: 'center', width: 190 },
  mapaDetalle: { flexGrow: 1, paddingLeft: 15 },
  etiqueta: {
    backgroundColor: COLORES.verdeSuave,
    borderRadius: 3,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  etiquetaNegativa: { backgroundColor: COLORES.rojoSuave },
  etiquetaTexto: { fontSize: 7 },
  etiquetaTotal: { fontFamily: 'Helvetica-Bold', fontSize: 7 },
  reparto: { color: COLORES.tenue, fontSize: 7, marginBottom: 5 },
  observacion: {
    borderTopColor: COLORES.borde,
    borderTopWidth: 0.7,
    marginTop: 8,
    paddingTop: 8,
  },
  observacionPrimera: { borderTopWidth: 0, marginTop: 0, paddingTop: 0 },
  observacionCabecera: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  observacionFecha: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  observacionMeta: { color: COLORES.tenue, fontSize: 7 },
  observacionNotas: { fontSize: 8.5, marginBottom: 5 },
  criterios: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap' },
  criterio: {
    backgroundColor: COLORES.azulSuave,
    borderRadius: 3,
    color: COLORES.azul,
    fontSize: 7,
    marginBottom: 3,
    marginRight: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  valoracion: {
    borderLeftColor: COLORES.verde,
    borderLeftWidth: 3,
    marginBottom: 8,
    paddingLeft: 9,
  },
  valoracionCabecera: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  vacio: { color: COLORES.tenue, fontSize: 8, fontStyle: 'italic' },
  pieFondo: {
    backgroundColor: '#cbdbe7',
    borderLeftColor: COLORES.verdeMarca,
    borderLeftWidth: 3,
    borderRadius: 4,
    height: 24,
    left: 34,
    position: 'absolute',
    right: 34,
    top: 802,
  },
  pieMarca: {
    color: COLORES.azulOscuro,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    left: 45,
    position: 'absolute',
    top: 810,
  },
  pieDescripcion: {
    color: COLORES.tenue,
    fontSize: 6.5,
    left: 82,
    position: 'absolute',
    top: 811,
  },
  piePagina: {
    color: COLORES.tenue,
    fontSize: 6.5,
    position: 'absolute',
    right: 43,
    top: 811,
  },
})

function LineasCampoPdf() {
  return (
    <>
      <Rect fill={COLORES.campo} height="105" width="68" x="0" y="0" />
      {Array.from({ length: 7 }, (_, indice) =>
        indice % 2 === 0 ? (
          <Rect
            fill="#ffffff"
            fillOpacity="0.035"
            height="15"
            key={`franja-${indice}`}
            width="68"
            x="0"
            y={indice * 15}
          />
        ) : null,
      )}
      <Rect fill="none" height="103" stroke={COLORES.lineaCampo} strokeWidth="0.35" width="66" x="1" y="1" />
      <Line stroke={COLORES.lineaCampo} strokeWidth="0.35" x1="1" x2="67" y1="52.5" y2="52.5" />
      <Circle cx="34" cy="52.5" fill="none" r="9.15" stroke={COLORES.lineaCampo} strokeWidth="0.35" />
      <Circle cx="34" cy="52.5" fill={COLORES.lineaCampo} r="0.45" />
      <Rect fill="none" height="16.5" stroke={COLORES.lineaCampo} strokeWidth="0.35" width="40.32" x="13.84" y="1" />
      <Rect fill="none" height="5.5" stroke={COLORES.lineaCampo} strokeWidth="0.35" width="18.32" x="24.84" y="1" />
      <Rect fill="none" height="16.5" stroke={COLORES.lineaCampo} strokeWidth="0.35" width="40.32" x="13.84" y="87.5" />
      <Rect fill="none" height="5.5" stroke={COLORES.lineaCampo} strokeWidth="0.35" width="18.32" x="24.84" y="98.5" />
    </>
  )
}

function MapaPosicionesPdf({
  posiciones,
  naturales,
  aptas,
}: {
  posiciones: Posicion[]
  naturales: number[]
  aptas: number[]
}) {
  const porCodigo = new Map(posiciones.map((posicion) => [posicion.codigo, posicion]))

  return (
    <Svg height="162" viewBox="0 0 68 105" width="105">
      <LineasCampoPdf />
      {ZONAS_CAMPO_POSICION.map((zona) => {
        const posicion = porCodigo.get(zona.codigo)
        const natural = posicion ? naturales.includes(posicion.id) : false
        const apta = posicion ? aptas.includes(posicion.id) : false
        const geometria = obtenerGeometriaZonaPosicion(zona)
        const x = (geometria.izquierda / 100) * 68
        const y = (geometria.arriba / 100) * 105
        const width = (geometria.ancho / 100) * 68
        const height = (geometria.alto / 100) * 105
        const relleno = natural
          ? COLORES.posicionNatural
          : apta
            ? COLORES.posicionApta
            : '#ffffff'
        const colorTexto = natural ? '#06211b' : apta ? '#101403' : '#b8cec1'

        return (
          <G key={zona.codigo}>
            <Rect
              fill={relleno}
              fillOpacity={natural || apta ? 0.96 : 0.065}
              height={height}
              rx="1.2"
              stroke={natural || apta ? relleno : '#88aa98'}
              strokeWidth={natural || apta ? 0.35 : 0.2}
              width={width}
              x={x}
              y={y}
            />
            <Text style={{ fill: colorTexto, fontSize: 3.35 }} textAnchor="middle" x={x + width / 2} y={y + height / 2 + 1.15}>
              {zona.abreviatura}
            </Text>
          </G>
        )
      })}
    </Svg>
  )
}

function FondoDecorativo() {
  return (
    <>
      <View fixed style={styles.haloVerde} />
      <View fixed style={styles.haloAzul} />
    </>
  )
}

function MarcaDocumento({
  fecha,
  logoSrc,
  numeroPartidos,
}: {
  fecha: string
  logoSrc?: string
  numeroPartidos: number
}) {
  return (
    <View style={styles.marca} wrap={false}>
      <View style={styles.marcaLinea} />
      <View style={styles.logoCrop}>
        <Image src={logoSrc ?? logoAppOjeoSquare} style={styles.logoMarca} />
      </View>
      <View style={styles.marcaTexto}>
        <View style={styles.marcaNombre}>
          <Text style={styles.marcaGal}>Gal</Text>
          <Text style={styles.marcaScout}>Scout</Text>
        </View>
        <Text style={styles.marcaSubtitulo}>Plataforma de scouting de fútbol</Text>
      </View>
      <View style={styles.documentoIdentidad}>
        <Text style={styles.documentoTipo}>Informe de jugador</Text>
        <Text style={styles.documentoMeta}>
          {fecha} - {numeroPartidos} {numeroPartidos === 1 ? 'partido' : 'partidos'} analizados
        </Text>
      </View>
    </View>
  )
}

function CabeceraJugador({ datos }: { datos: DatosInformeJugador }) {
  const { jugador } = datos
  return (
    <View style={styles.cabecera} wrap={false}>
      <View style={styles.cabeceraAcento} />
      <View style={styles.avatarMarco}>
        <Image src={datos.imagenJugadorSrc ?? playerPlaceholder} style={styles.avatar} />
      </View>
      <View style={styles.identidad}>
        <Text style={styles.nombre}>{jugador.nombre}</Text>
        <Text style={styles.estado}>{jugador.estado}</Text>
        <View style={styles.datos}>
          <Dato etiqueta="Edad" valor={`${jugador.edad} años`} />
          <Dato etiqueta="Altura" valor={`${jugador.alturaCm} cm`} />
          <Dato etiqueta="Equipo" valor={jugador.equipoActual ?? 'Sin equipo'} />
          <Dato etiqueta="Pierna dominante" valor={jugador.piernaDominante} />
          {jugador.categoria && <Dato etiqueta="Categoría" valor={jugador.categoria} />}
        </View>
      </View>
      <View style={styles.posicion}>
        <Text style={styles.posicionTitulo}>Perfil posicional</Text>
        <MapaPosicionesPdf
          aptas={datos.posicionesAptasIds}
          naturales={datos.posicionesNaturalesIds}
          posiciones={datos.posiciones}
        />
        <View style={styles.posicionLeyenda}>
          <View style={styles.posicionLeyendaItem}>
            <View style={[styles.posicionLeyendaPunto, { backgroundColor: COLORES.posicionNatural }]} />
            <Text style={styles.posicionLeyendaTexto}>Natural</Text>
          </View>
          <View style={styles.posicionLeyendaItem}>
            <View style={[styles.posicionLeyendaPunto, { backgroundColor: COLORES.posicionApta }]} />
            <Text style={styles.posicionLeyendaTexto}>Apta</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  )
}

function RatiosPdf({ acciones, perfil }: { acciones: AccionObservacionDePartido[]; perfil: PerfilScouting }) {
  const pares = calcularPares(acciones, perfil).filter((par) => par.nucleo || par.intentos > 0)
  return (
    <View style={styles.seccion} wrap={false}>
      <Text style={styles.seccionTitulo}>Ratios de acierto</Text>
      <Text style={styles.seccionAyuda}>Relación entre acciones resueltas y el total de intentos registrados.</Text>
      {pares.map((par) => (
        <View key={par.clave} style={styles.filaRatio}>
          <View style={styles.filaCabecera}>
            <Text style={styles.filaTitulo}>{par.titulo}</Text>
            <Text style={styles.filaValor}>
              {par.porcentajeExito === null ? 'Sin datos' : `${Math.round(par.porcentajeExito)} % (${par.aciertos}/${par.intentos})`}
            </Text>
          </View>
          <View style={styles.pista}>
            <View style={[styles.relleno, { width: `${par.porcentajeExito ?? 0}%` }]} />
          </View>
          <Text style={styles.detalle}>{par.detalleAyuda}</Text>
        </View>
      ))}
    </View>
  )
}

function ColumnaRepertorio({
  titulo,
  datos,
  primera = false,
}: {
  titulo: string
  datos: ReturnType<typeof calcularConteos>
  primera?: boolean
}) {
  return (
    <View style={[styles.repertorioColumna, primera ? styles.repertorioColumnaPrimera : {}]}>
      <Text style={styles.subtitulo}>{titulo}</Text>
      {datos.length === 0 && <Text style={styles.vacio}>Sin registros.</Text>}
      {datos.map((conteo) => (
        <View key={conteo.etiquetaNombre} style={styles.repertorioFila}>
          <Text style={styles.repertorioNombre}>{conteo.etiquetaNombre}</Text>
          <Text style={styles.repertorioTotal}>{conteo.total}</Text>
        </View>
      ))}
    </View>
  )
}

function RepertorioPdf({ acciones }: { acciones: AccionObservacionDePartido[] }) {
  const conteos = calcularConteos(acciones)
  const positivas = conteos.filter((conteo) => conteo.categoria === 'positiva')
  const negativas = conteos.filter((conteo) => conteo.categoria === 'negativa')

  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>Repertorio</Text>
      <Text style={styles.seccionAyuda}>Frecuencia de las acciones registradas en los partidos seleccionados.</Text>
      <View style={styles.repertorioColumnas}>
        <ColumnaRepertorio datos={positivas} primera titulo="Acciones positivas" />
        <ColumnaRepertorio datos={negativas} titulo="Acciones negativas" />
      </View>
    </View>
  )
}

function CampoAccionesPdf({ acciones, modo }: { acciones: AccionObservacionDePartido[]; modo: 'puntos' | 'zonas' }) {
  const zonas = calcularZonas(acciones)
  const tercios = ['defensivo', 'medio', 'ofensivo']
  const carriles = ['izquierdo', 'central', 'derecho']

  return (
    <Svg height="252" viewBox="0 0 68 105" width="163">
      <LineasCampoPdf />
      {modo === 'zonas' &&
        zonas.celdas.map((celda) => {
          const indiceTercio = tercios.indexOf(celda.tercio)
          const indiceCarril = carriles.indexOf(celda.carril)
          const x = indiceCarril * (68 / 3)
          const y = (2 - indiceTercio) * (105 / 3)
          const intensidad = zonas.maximoCelda > 0 && celda.total > 0 ? 0.18 + 0.55 * (celda.total / zonas.maximoCelda) : 0
          return (
            <G key={`${celda.tercio}-${celda.carril}`}>
              <Rect fill={COLORES.verde} fillOpacity={intensidad} height={35} stroke={COLORES.lineaCampo} strokeWidth="0.2" width={68 / 3} x={x} y={y} />
              {celda.total > 0 && (
                <Text style={{ fill: '#ffffff', fontSize: 4.5 }} textAnchor="middle" x={x + 68 / 6} y={y + 19}>
                  {celda.total}
                </Text>
              )}
            </G>
          )
        })}
      {modo === 'puntos' &&
        acciones.map((accion) => (
          <Circle
            cx={(normalizarY(accion) / 100) * 68}
            cy={105 - (normalizarX(accion) / 100) * 105}
            fill={accion.categoria === 'positiva' ? '#57c789' : '#e06a6a'}
            key={accion.id}
            r="1.35"
            stroke="#ffffff"
            strokeWidth="0.25"
          />
        ))}
    </Svg>
  )
}

function MapaPdf({ mapa, acciones }: { mapa: ConfiguracionMapaInforme; acciones: AccionObservacionDePartido[] }) {
  const permitidas = new Set(mapa.etiquetas)
  const filtradas = filtrarAccionesDeJuego(acciones).filter((accion) => permitidas.has(accion.etiquetaNombre))
  const conteos = calcularConteos(filtradas)
  const zonas = calcularZonas(filtradas)

  return (
    <View style={styles.seccion} wrap={false}>
      <Text style={styles.seccionTitulo}>{mapa.titulo.trim() || 'Mapa de acciones'}</Text>
      <Text style={styles.seccionAyuda}>
        {mapa.modo === 'zonas' ? 'Concentración por zonas del campo' : 'Localización de cada acción'} - {filtradas.length} acciones
      </Text>
      <View style={styles.mapaContenido}>
        <View style={styles.mapaCampo}>
          <CampoAccionesPdf acciones={filtradas} modo={mapa.modo} />
        </View>
        <View style={styles.mapaDetalle}>
          <Text style={styles.subtitulo}>Acciones incluidas</Text>
          {conteos.length === 0 && <Text style={styles.vacio}>Sin acciones para estos filtros.</Text>}
          {conteos.map((conteo) => (
            <View key={conteo.etiquetaNombre} style={[styles.etiqueta, conteo.categoria === 'negativa' ? styles.etiquetaNegativa : {}]}>
              <Text style={styles.etiquetaTexto}>{conteo.etiquetaNombre}</Text>
              <Text style={styles.etiquetaTotal}>{conteo.total}</Text>
            </View>
          ))}
          {zonas.porcentajeCampoContrario !== null && (
            <Text style={styles.reparto}>{Math.round(zonas.porcentajeCampoContrario)} % en campo contrario</Text>
          )}
          <Text style={styles.reparto}>Ataca hacia arriba</Text>
        </View>
      </View>
    </View>
  )
}

const ETIQUETAS_TIPO: Record<string, string> = {
  partido: 'Partido',
  entrenamiento: 'Entrenamiento',
  otro: 'Otro',
}

function ObservacionPdfItem({
  observacion,
  primera = false,
}: {
  observacion: ObservacionJugador
  primera?: boolean
}) {
  return (
    <View style={[styles.observacion, primera ? styles.observacionPrimera : {}]} wrap={false}>
      <View style={styles.observacionCabecera}>
        <Text style={styles.observacionFecha}>{formatearFecha(observacion.fechaObservacion)} - {ETIQUETAS_TIPO[observacion.tipo ?? ''] ?? 'Observación'}</Text>
        <Text style={styles.observacionMeta}>{observacion.autorNombre}</Text>
      </View>
      {observacion.tipo === 'partido' && (observacion.equipoJugador || observacion.equipoRival) && (
        <Text style={styles.observacionMeta}>
          {observacion.equipoJugador ?? '?'} vs {observacion.equipoRival ?? '?'}
          {observacion.competicion ? ` - ${observacion.competicion}` : ''}
          {observacion.jornada ? ` - ${observacion.jornada}` : ''}
        </Text>
      )}
      <Text style={styles.observacionNotas}>{observacion.notas || 'Sin notas.'}</Text>
      {observacion.valoraciones.length > 0 && (
        <View style={styles.criterios}>
          {observacion.valoraciones.map((valoracion) => (
            <Text key={valoracion.criterioNombre} style={styles.criterio}>
              {valoracion.criterioNombre}: {valoracion.puntuacion}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}

function ObservacionesPdf({ observaciones }: { observaciones: ObservacionJugador[] }) {
  const [primera, ...resto] = observaciones
  return (
    <View style={styles.seccion}>
      <View wrap={false}>
        <Text style={styles.seccionTitulo}>Observaciones seleccionadas</Text>
        <Text style={styles.seccionAyuda}>{observaciones.length} informes incorporados al documento.</Text>
        <ObservacionPdfItem observacion={primera} primera />
      </View>
      {resto.map((observacion) => (
        <ObservacionPdfItem key={observacion.id} observacion={observacion} />
      ))}
    </View>
  )
}

function ValoracionPdfItem({ valoracion }: { valoracion: ValoracionGeneral }) {
  return (
    <View style={styles.valoracion} wrap={false}>
      <View style={styles.valoracionCabecera}>
        <Text style={styles.observacionFecha}>{formatearFecha(valoracion.fechaValoracion)} - {valoracion.autorNombre}</Text>
      </View>
      <Text style={styles.observacionNotas}>{valoracion.comentario || 'Sin comentario.'}</Text>
    </View>
  )
}

function ValoracionesPdf({ valoraciones }: { valoraciones: ValoracionGeneral[] }) {
  const [primera, ...resto] = valoraciones
  return (
    <View style={styles.seccion}>
      <View wrap={false}>
        <Text style={styles.seccionTitulo}>Informes generales</Text>
        <Text style={styles.seccionAyuda}>{valoraciones.length} informes incorporados al documento.</Text>
        <ValoracionPdfItem valoracion={primera} />
      </View>
      {resto.map((valoracion) => (
        <ValoracionPdfItem key={valoracion.id} valoracion={valoracion} />
      ))}
    </View>
  )
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha
}

function PieDocumento({ nombreJugador }: { nombreJugador: string }) {
  return (
    <>
      <View fixed style={styles.pieFondo} />
      <Text fixed style={styles.pieMarca}>GalScout</Text>
      <Text fixed style={styles.pieDescripcion}>Informe confidencial de scouting</Text>
      <Text
        fixed
        render={({ pageNumber, totalPages }) =>
          `${nombreJugador} - Página ${pageNumber} de ${totalPages}`
        }
        style={styles.piePagina}
      />
    </>
  )
}

function PlayerReportDocument(datos: DatosInformeJugador) {
  const idsPartidos = new Set(datos.configuracion.idsPartidos)
  const acciones = datos.acciones.filter((accion) => idsPartidos.has(accion.observacionId))
  const idsObservaciones = new Set(datos.configuracion.idsObservaciones)
  const observaciones = datos.observaciones.filter((observacion) => idsObservaciones.has(observacion.id))
  const idsValoraciones = new Set(datos.configuracion.idsValoracionesGenerales)
  const valoraciones = datos.valoracionesGenerales.filter((valoracion) => idsValoraciones.has(valoracion.id))
  const fechaGeneracion = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date())

  return (
    <Document author="GalScout" subject={`Informe de scouting de ${datos.jugador.nombre}`} title={`Informe de ${datos.jugador.nombre}`}>
      <Page size="A4" style={styles.pagina}>
        <FondoDecorativo />
        <MarcaDocumento
          fecha={fechaGeneracion}
          logoSrc={datos.logoSrc}
          numeroPartidos={datos.configuracion.idsPartidos.length}
        />
        <CabeceraJugador datos={datos} />
        {datos.configuracion.incluirRatios && <RatiosPdf acciones={acciones} perfil={datos.perfilScouting} />}
        {datos.configuracion.incluirRepertorio && <RepertorioPdf acciones={acciones} />}
        {datos.configuracion.mapas.map((mapa) => (
          <MapaPdf acciones={acciones} key={mapa.id} mapa={mapa} />
        ))}
        {observaciones.length > 0 && <ObservacionesPdf observaciones={observaciones} />}
        {valoraciones.length > 0 && <ValoracionesPdf valoraciones={valoraciones} />}
        <PieDocumento nombreJugador={datos.jugador.nombre} />
      </Page>
    </Document>
  )
}

export default PlayerReportDocument
