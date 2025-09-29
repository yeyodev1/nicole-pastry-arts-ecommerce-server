// En el nuevo archivo: api/index.ts

import createApp from '../app';      // Importa tu función original
import dbConnect from '../config/mongo'; // Importa tu conexión a la BD

// Llama a la función para obtener solo la 'app' de Express
const { app } = createApp();

// Exporta la app. Esto es lo que Vercel necesita.
// La conexión a la BD se manejará dentro de las rutas que la necesiten.
export default app;