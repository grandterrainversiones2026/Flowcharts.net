# Mermaid Studio

Editor visual local-first para crear diagramas de flujo y exportarlos como código Mermaid.

## Ejecutar

La aplicación no requiere dependencias ni proceso de compilación. Sirve la carpeta con cualquier servidor HTTP local:

```bash
python3 -m http.server 4173
```

Después abre `http://localhost:4173`.

## Funciones

- Crear, mover, renombrar, duplicar y eliminar nodos visualmente.
- Conectar procesos y decisiones.
- Editar el código Mermaid sincronizado con el lienzo.
- Copiar código Mermaid desde el diálogo de exportación.
- Abrir una carpeta local o archivos `.text`/`.txt`.
- Guardar el modelo visual en un archivo local `.text`.
