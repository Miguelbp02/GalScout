import { pdf } from '@react-pdf/renderer'
import PlayerReportDocument from './PlayerReportDocument'
import type { DatosInformeJugador } from './PlayerReportDocument'

export async function generarInformeJugadorPdf(datos: DatosInformeJugador) {
  return pdf(<PlayerReportDocument {...datos} />).toBlob()
}
