import { createConnection as dbConnect } from 'mysql2/promise';
import { once, EventEmitter } from 'events';
import { randomInt } from 'crypto';

class App {
    constructor() {
    }

    log(msg) {
        console.log('[', new Date(), ']', msg);
    }

    async run(inicio, fin) {
        let db = undefined;

        // nos conectamos a la base de datos
        try {
            this.log("Conectando a la Base de Datos");
            db = await dbConnect({
                host: '127.0.0.1',
                port: 3306,
                database: 'smartbee',
                user: 'smartbee.admin',
                password: 'ithi3ung4oojePha3Eez'
            });
            this.log("Conectado a la Base de Datos");
        } catch (err) {
            if (db)
                await db.end();
            this.log(`Error al conectar a la Base de Datos: ${err.message}`);
            return;
        }

        // recuperamos los nodos
        let nodos;
        try {
            this.log('Recuperando los nodos');
            const sql = 'SELECT n.id, n.tipo FROM nodo n ORDER by n.tipo';
            const [rows] = await db.query(sql);
            nodos = rows;
        } catch (err) {
            this.log(err.message);
            await db.end();
            return;
        }

        // recuperamos los tipos de alerta
        let alertas;
        try {
            this.log('Recuperando los tipos de alerta');
            const sql = 'SELECT id, indicador FROM alerta ORDER by indicador';
            const [rows] = await db.query(sql);
            alertas = rows;
        } catch (err) {
            this.log(err.message);
            await db.end();
            return;
        }


        try {
            let sql
            this.log("Eliminando registros de tabla 'nodo_alerta'");
            sql = "DELETE FROM nodo_alerta";
            await db.query(sql);
            this.log("Reseteando Auto Increment de tabla 'nodo_alerta'");
            sql = "ALTER TABLE nodo_alerta AUTO_INCREMENT=1";
            await db.query(sql);
        } catch (err) {
            this.log(err.message);
            await db.end();
            return;
        }

        this.log("Iniciando Generación de Alertas");
        const fecha_fin = new Date(fin);
        for (const nodo of nodos) {
            let fecha = new Date(inicio);
            this.log(`${nodo.id}:${nodo.tipo} / ${fecha.toISOString()} -> ${fecha_fin.toISOString()}`);
            while (fecha <= fecha_fin) {
                // por cada medicion determinamos al azar (5%) si generamos la alerta
                if (randomInt(100) < 5) {
                    let r = alertas[randomInt(alertas.length)];
                    if (nodo.tipo == 'COLMENA' || r.indicador.includes('Extern')) {
                        this.log(`Alerta ${r.indicador} para nodo ${nodo.tipo} en ${fecha.toISOString()}`);
                        const sql = "INSERT INTO nodo_alerta(nodo_id, alerta_id,fecha) VALUES(?,?,?)";
                        await db.query(sql, [nodo.id, r.id, fecha]);
                    }
                }

                // cada 15 minutos
                fecha = new Date(fecha.getTime() + 15 * 60 * 1000);
            }
        };
        this.log("Fin de la Generación de Alertas");
        await db.end();
    }
}

// --- SHow Time

// esto impacta a las tablas de mensajes y alertas
const event = new EventEmitter();

process.stdout.write("\nEsto borrara los registros de la tabla nodo_alerta reseteando su Auto Increment a 1.\n")
process.stdout.write("\nDesea continuar, presione Y: ");

process.stdin.setEncoding("utf8");
process.stdin.once("data", (input) => {
    if (input.trim().toUpperCase() === "Y") {
        event.emit('continue');
    } else {
        process.exit(0);
    }
});
await once(event, 'continue');
process.stdin.destroy();

const now = new Date();
const inicio = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0);
const app = new App();
console.log(inicio);
await app.run('2024-08-01 00:00:00', '2025-12-31 23:59:59');
