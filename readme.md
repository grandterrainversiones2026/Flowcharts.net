# Flowcharts

Flowcharts es un editor visual local-first para crear flowcharts y exportarlos como código Mermaid.

## Ejecutar

La aplicación no requiere dependencias ni proceso de compilación. Sirve la carpeta con cualquier servidor HTTP local:

```bash
python3 -m http.server 4173
```

Después abre `http://localhost:4173`.

## Funciones

- Crear, arrastrar, editar inline, duplicar y eliminar uno o varios nodos visualmente.
- Seleccionar múltiples nodos con un recuadro y editar color, forma, tamaño y alineación en conjunto.
- Conectar procesos y decisiones arrastrando sus cuatro puertos direccionales o crear un nodo nuevo con un clic.
- Editar e importar código Mermaid con distribución automática lógica por niveles.
- Colorear nodos opcionalmente con colores predeterminados o personalizados y configurar líneas curvas direccionales, esquinadas, rectas o discontinuas, texto y dirección de flechas.
- Copiar código Mermaid o exportarlo como `.txt` seleccionando una carpeta.
- Abrir una carpeta local o archivos `.text`/`.txt` y conservar un historial local de sus ubicaciones.
- Guardar el modelo visual en un archivo local `.text`.
- Mover el lienzo manteniendo clic derecho, hacer zoom con la rueda y navegar con una vista general en tiempo real.
- Crear rápidamente un nodo conectado manteniendo espacio o conectar con un nodo existente al pasar sobre él.
- Eliminar nodos o conexiones seleccionadas con `Del`.
- Ocultar completamente el panel de código para ampliar el lienzo y recuperarlo desde la cabecera.
- Alternar entre tema oscuro gris/azul y tema claro blanco/azul suave.

- `Ctrl+Z` deshace cambios; `Ctrl` permite combinar nodos y conexiones en la selección.
- La herramienta Título crea texto libre conectable.
- Las conexiones curvas, esquinadas y rectas se recalculan automáticamente al mover sus nodos; discontinuidad, inversión y posición de etiqueta se editan por separado.
- El historial evita duplicados del mismo archivo y avisa antes de salir con cambios sin guardar.
- La vista general y sus controles aparecen al desplazar o ampliar el board.
- Los controles de zoom/deshacer/rehacer permanecen visibles mientras la vista general aparece solo durante la navegación.
- La salida con cambios pendientes utiliza un diálogo integrado, y los nodos se desplazan libremente sin ajuste a cuadrícula.
- El importador reconoce subgrafos Mermaid, etiquetas HTML (`<br>`, `<i>`) y conexiones etiquetadas con `A -- "texto" --> B`.
- Las conexiones siguen directamente su forma visual y el código Mermaid; no se desvían automáticamente alrededor de otros nodos.

- Los subgrafos importados se organizan automáticamente en secciones visuales con sus propios recuadros.
- Las conexiones no tienen puntos ni moldeado manual: se reposicionan automáticamente al mover sus nodos.
