import { Fragment } from 'react'

interface FormattedNotesProps {
  texto: string
}

// El editor del modo partido guarda un marcado mínimo: líneas que empiezan por
// "# " son títulos y **texto** va en negrita. Las observaciones escritas a mano
// no llevan marcado y se muestran tal cual.
function resaltarNegrita(linea: string) {
  return linea.split(/(\*\*[^*]+\*\*)/g).map((parte, indice) =>
    parte.startsWith('**') && parte.endsWith('**') && parte.length > 4 ? (
      <strong key={indice}>{parte.slice(2, -2)}</strong>
    ) : (
      <Fragment key={indice}>{parte}</Fragment>
    ),
  )
}

function FormattedNotes({ texto }: FormattedNotesProps) {
  return (
    <div className="observation-notes-formateadas">
      {texto.split('\n').map((linea, indice) => {
        if (!linea.trim()) {
          return <div className="observation-nota-espacio" key={indice} />
        }

        if (linea.startsWith('# ')) {
          return (
            <p className="observation-nota-titulo" key={indice}>
              {resaltarNegrita(linea.slice(2))}
            </p>
          )
        }

        return (
          <p className="observation-nota-linea" key={indice}>
            {resaltarNegrita(linea)}
          </p>
        )
      })}
    </div>
  )
}

export default FormattedNotes
