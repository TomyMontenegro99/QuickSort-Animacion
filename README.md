# QuickSort Animación

Aplicación web interactiva que permite introducir 10 números, visualizarlos y
seguir paso a paso el algoritmo de QuickSort mediante animaciones.

## Características

- Ingreso de 10 números con actualización visual inmediata.
- Botón para generar valores aleatorios y opción de reinicio.
- Selector de velocidad para acelerar o desacelerar la animación.
- Animaciones que muestran pivote, comparaciones, intercambios y elementos
  ordenados.
- Explicaciones en español de cada paso del algoritmo.

## Ejecución

1. Clona el repositorio y entra en la carpeta del proyecto.
2. Ejecuta un servidor estático, por ejemplo:

   ```bash
   python3 -m http.server 8000
   ```

   > ℹ️ Si Visual Studio Code muestra el mensaje `no se encontró Python`,
   > tienes varias alternativas:
   >
   > - Instalar Python desde la Microsoft Store y volver a ejecutar el comando.
   > - Usar la extensión **Live Server** de VS Code y pulsar "Open with Live Server" sobre `index.html`.
   > - Si tienes Node.js instalado, ejecutar `npx serve .` desde la carpeta del proyecto.
   > - Abrir directamente el archivo `index.html` en el navegador (doble clic) sin servidor.

3. Abre <http://localhost:8000> en el navegador y selecciona `index.html` (o
   utiliza la opción que hayas elegido en el paso anterior).

4. Ajusta la velocidad de la animación desde el selector **Velocidad** si quieres
   que el recorrido sea más rápido o más pausado.

¡Listo! Ya puedes experimentar con diferentes conjuntos de números y visualizar
cómo QuickSort los ordena paso a paso.
