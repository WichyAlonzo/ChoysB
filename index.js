/*
    version: 1.0.315 BETA
    creado: 6 de Junio del 2024
    desarrollador: Wichy Alonzo
*/

const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, Location, MessageMedia, MessageAck } = require('whatsapp-web.js');
const { exec } = require('child_process');
let client;
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer-core');
const readline = require('readline');
const colors = require('colors');
const notifier = require('node-notifier');
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const numeros = require("numeros_a_palabras");
const childProcess = require('child_process');
let parametroPython = '';
const moment = require('moment');


const pScriptPath = path.resolve(__dirname, 'app/grupos/opens/script.js');

// Ajustes para Numeros a Letras
numeros.numero2word().Config._setSingular("peso");
numeros.numero2word().Config._setPlural("pesos");
numeros.numero2word().Config._setCentsSingular("centavo");
numeros.numero2word().Config._setCentsPlural("centavos");


// Variables de mensajes
let espacioPreguntas = '    ';
let espacioPreguntasDos = '        ';
let mnsBienvenida = colors.yellow(`${espacioPreguntas}WhatsApp MK-Ultra 1.0.315 BETA
${espacioPreguntas}Envia mensajes de forma masiva a todos tus clientes de forma automatizada\n\n`);

// JSON, Arrays
const dataTipoCliente = JSON.parse(fs.readFileSync('app/ventas/files.json', 'utf8'));
const gruposPath = 'app/mkting/grupos.json';
const mensaje = fs.readFileSync('app/mkting/mnsG.txt', 'utf8');
const imagenes = JSON.parse(fs.readFileSync('app/mkting/files.json', 'utf8'));
const mnsCliente = {
    1: 'app/mns/leads.txt',
    2: 'app/mns/labis.txt',
    3: 'app/mns/mayoristas.txt',
    4: 'app/mns/departamentales.txt'
};
let opcionesCreada = [];
let etiquetasCreadas = [];
const db = new sqlite3.Database('app/db.db');

// Rutas
const chromeExePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chromexExePath = 'C:/Program Files/Google/Chrome/Application/chromex.exe';



// Función para limpiar el proceso de Puppeteer y los procesos de Chrome asociados
async function cleanUpProcesses() {
    try {
        await exec(`taskkill /f /im chromex.exe`);
        console.log('¡Adiós!');
    } catch (error) {
        console.error('Error cleaning up processes:', error);
    } finally {
        process.exit(); // Salir del proceso Node.js después de limpiar
    }
}

// Manejadores de señales para limpiar procesos antes de salir
process.on('SIGINT', async() => {
    console.log(colors.cyan(`${espacioPreguntas} Se limpio el programa ;)`));
    await cleanUpProcesses();
});

process.on('SIGTERM', async() => {
    console.log(colors.cyan(`${espacioPreguntas} Se limpio el programa ;)`));
    await cleanUpProcesses();
});






// Función para verificar si el archivo chrome.exe existe
function checkChromeExists() {
    return fs.existsSync(chromeExePath);
}

// Función para verificar si el archivo chromex.exe existe
function checkChromexExists() {
    return fs.existsSync(chromexExePath);
}

function isRunningAsAdmin() {
    const testFilePath = 'C:\\Program Files\\test-admin-check.txt';
    try {
        fs.writeFileSync(testFilePath, 'Admin test');
        fs.unlinkSync(testFilePath);
        return true;

    } catch (error) {
        console.error('Ejecuta el programa como Admnistrador:');
        return false;

    }
}

// Función para copiar chrome.exe como chromex.exe
function copyChromeToChromex() {
    if (!isRunningAsAdmin()) {
        console.log('Se requieren permisos de administrador para copiar los archivos.');
        return;

    } else {
        fs.copyFileSync(chromeExePath, chromexExePath);
        console.log('Copied chrome.exe to chromex.exe');


        // Aqui va la logica del inicio multiple de sesion
        function mainInit() {
            const settingsPath = path.join(__dirname, 'app/settings.json');
            fs.readFile(settingsPath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error leyendo el archivo:', err);
                    return;
                }

                const settings = JSON.parse(data);
                const { selectGroups, ventas, finanzas, grupos, reacciones, dif } = settings[0];

                // Difusiones
                if (dif) {
                    multiSession();

                } else {
                    inciarClient();

                }
            });
        }

        // Inicia el programa
        mainInit();



    }
}

function verifyAndCopyChrome() {
    if (!checkChromeExists()) {
        console.log(`Archivo ${chromeExePath} no encontrado.`);
        return;
    }

    if (!checkChromexExists()) {
        console.log('Copiando chrome.exe como chromex.exe...');
        copyChromeToChromex();

    } else {
        console.log('chromex.exe ya existe.');
        const chromeExePathSize = fs.statSync(chromeExePath).size;
        const chromexExePathSize = fs.statSync(chromexExePath).size;
        if (chromeExePathSize !== chromexExePathSize) {
            console.log(`${chromexExePathSize} no es igual en peso a ${chromeExePathSize}`);
            copyChromeToChromex();

        } else {
            console.log(`${chromexExePathSize} es igual en peso a ${chromeExePathSize}`);
            // Aqui va la logica del inicio multiple de sesion
            function mainInit() {
                const settingsPath = path.join(__dirname, 'app/settings.json');
                fs.readFile(settingsPath, 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error leyendo el archivo:', err);
                        return;
                    }

                    const settings = JSON.parse(data);
                    const { selectGroups, ventas, finanzas, grupos, reacciones, dif } = settings[0];

                    // Difusiones
                    if (dif) {
                        multiSession();

                    } else {
                        inciarClient();

                    }
                });
            }

            // Inicia el programa
            mainInit();

        }
    }
}
/*
    Funciona bien (16-Junio-2024)
    2.2413.51-beta.html

    Funciona bien (17-Junio-2024)
    2.2412.1-beta.html
*/
// 2.2413.51-beta.html
function exePython(param) {
    return new Promise((resolve, reject) => {
        childProcess.exec('python ventas.py ' + param, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error}`);
                reject(error);

            } else {
                resolve(stdout); // Resuelve la promesa con stdout

            }
        });
    });
}


async function inciarClient() {
    await exec(`taskkill /f /im chromex.exe`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            executablePath: 'C:/Program Files/Google/Chrome/Application/chromex.exe',
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        webVersionCache: {
            type: 'remote',
            // remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51-beta.html',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014590669-alpha',
        }
    });

    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });

    });

    client.on('ready', async() => {
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        async function insertarRegistro(numeroLimpio, tipo, fecha, send, label) {
            await db.run(`INSERT INTO clientes (numeroLimpio, tipo, fecha, send, etiqueta) VALUES (?, ?, ?, ?, ?)`, numeroLimpio, tipo, fecha, send, label);
        }


        async function askAsesor() {
            console.clear();
            console.log(mnsBienvenida);





            /*
                Chicas de Marketing
                    - Envio de mensajes a grupos
            */
            function chicasMKTing() {
                function enviarMKTing() {
                    rl.removeAllListeners('line');
                    async function selectGroupsMkting() {
                        console.log(mnsBienvenida);

                        function getGrupos() {
                            try {
                                const data = fs.readFileSync(gruposPath, 'utf8');
                                return JSON.parse(data);

                            } catch (error) {
                                console.error('Error leyendo o parseando el archivo:', error);
                                return null;

                            }
                        }

                        function updateGrupos() {
                            try {
                                fs.writeFileSync(gruposPath, JSON.stringify([]));
                                console.log('Archivo actualizado a un arreglo vacío.');

                            } catch (error) {
                                console.error('Error actualizando el archivo:', error);

                            }
                        }

                        async function validateAndCountGrupos() {
                            const grupos = getGrupos();
                            if (!Array.isArray(grupos)) {
                                console.log('El contenido no es un arreglo. Actualizando el archivo...');
                                updateGrupos();
                                return;
                            }

                            if (grupos.length < 1) {
                                const numeroGrupos = grupos.length;
                                console.log(`${espacioPreguntas}   - El arreglo tiene menos de 5 elementos. Llamando a selectGroupsMkting...`);
                                selectGroupsMkting(numeroGrupos);

                            } else {
                                console.log(colors.bgWhite.black(`${espacioPreguntas}   Enviaremos mensaje a los Grupos de vendedoras`));
                                console.log(colors.bgWhite.black(`${espacioPreguntas}   Tienes 30s para revisar la informacion antes de comenzar enviar los los Mensajes`));
                                await delayWithCountdown(2000);
                                enviarMnsGrupos();

                            }
                        }

                        async function selectGroupsMkting(numeroGruposValidacion) {
                            const numeroGValidacion = `${numeroGruposValidacion} grupo${numeroGruposValidacion > 1 ? 's' : ''}`;
                            console.log(`${espacioPreguntas} Tienes  ${colors.red(numeroGValidacion)}, deben ser >5 grupos`);
                            console.log(`${espacioPreguntas}   - Copea el ${colors.bgYellow.black('ID')} del grupo con terminacion ${colors.bgYellow.black('@g.us')} y pegalo en archivo que se abrio`);
                            const chats = await client.getChats();
                            const grupos = chats.filter(chat => chat.isGroup);
                            const idsNombresGrupos = grupos.map(chat => ({ id: chat.id._serialized, nombre: chat.name }));
                            console.log(`${espacioPreguntas}  ${colors.bgWhite.black(' IDs y nombres de los grupos: ')}`);
                            idsNombresGrupos.forEach(grupo => {
                                console.log(`${espacioPreguntas}      ID: ${colors.bgYellow.black(grupo.id)} Nombre: ${colors.bgBlue.white(grupo.nombre === undefined ? 'N/A' : grupo.nombre)}`);
                            });


                            readlineGrupos.question(`\n\n${espacioPreguntas} Pega el id de los Grupos aquí: `, (input) => {
                                const gruposIds = input.split(' ');
                                const gruposData = gruposIds.map(id => id);

                                // Leer el archivo JSON si existe
                                const fs = require('fs');
                                let gruposJson = [];
                                try {
                                    gruposJson = JSON.parse(fs.readFileSync('app/mkting/grupos.json', 'utf8'));

                                } catch (error) {
                                    fs.writeFileSync('app/mkting/grupos.json', '[]');
                                    gruposJson = [];

                                }

                                gruposJson = [...gruposJson, ...gruposData];
                                fs.writeFileSync('app/mkting/grupos.json', JSON.stringify(gruposJson, null, 2));
                                console.log(`${espacioPreguntas} Grupos guardados en 'app/mkting/grupos.json'`);
                                validateAndCountGrupos();

                            });

                        }

                        async function delayWithCountdown(ms) {
                            for (let i = ms / 1000; i > 0; i--) {
                                process.stdout.write(`    ${espacioPreguntas}      ` + colors.bgMagenta.white(`Esperando ${i}...  \r`));
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                            process.stdout.write('\n');
                        }

                        async function enviarMnsGrupos() {
                            const grupos = JSON.parse(fs.readFileSync(gruposPath, 'utf8'));
                            for (let grupo of grupos) {
                                if (mensaje === '' || mensaje === ' ') {
                                    console.log('No se puede eniar el mensaje, Escribe un mensaje ara continuar');

                                } else {
                                    const chat = await client.getChatById(grupo);
                                    const nombreGrupo = chat.name;
                                    console.log(colors.yellow(`\n\n${espacioPreguntas}   Grupo: ${nombreGrupo}`));
                                    for (let file of imagenes) {
                                        const extension = file.split('.').pop();

                                        // Validacion de mensaje
                                        if (file === '' || file === ' ') {
                                            console.log(`    ${colors.bgYellow.black('Se Enviara Texto')}`);
                                            console.log(`    ${colors.bgRed.white('Debes seleccionar al menos una imagen para continuar...')}`);

                                        } else {
                                            if (extension === 'png' || extension === 'jpg') {
                                                console.log(`${espacioPreguntas}      ■ Imagen: ` + colors.cyan(`${file}`));
                                                const media = MessageMedia.fromFilePath(file);
                                                await client.sendMessage(grupo, media);
                                                await delayWithCountdown(2000); // Esperar 8 segundos entre cada imagen
                                                console.log(`\n`);

                                            } else if (extension === 'mp3') {
                                                console.log(`${espacioPreguntas}      ■ Audio: ` + colors.cyan(`${file}`));
                                                const media = MessageMedia.fromFilePath(file);
                                                await client.sendMessage(grupo, media);
                                                await delayWithCountdown(2000); // Esperar 8 segundos entre cada imagen
                                                console.log(`\n`);

                                            } else if (extension === 'pdf') {
                                                console.log(`${espacioPreguntas}      ■ PDF: ` + colors.cyan(`${file}`));
                                                const media = MessageMedia.fromFilePath(file);
                                                await client.sendMessage(grupo, media);
                                                await delayWithCountdown(2000); // Esperar 8 segundos entre cada imagen
                                                console.log(`\n`);

                                            }
                                        }
                                    }

                                    console.log(`${espacioPreguntas}      ■ Mensaje: ` + colors.cyan(`${mensaje}`));
                                    await client.sendMessage(grupo, mensaje);
                                    await delayWithCountdown(8000); // Esperar 20 segundos antes de pasar al siguiente grupo
                                    console.log(`\n\n`);


                                }
                            }
                            notifier.notify({
                                title: 'MKTing Terminamos 🎉',
                                message: `Se enviaron las imagenes y mensaje a los grupos 🤩`,
                                icon: './src/logo.png',

                            });
                            chicasMKTing();
                            // console.log(`${espacioPreguntas}   ` + colors.bgYellow.black(` Terminamos :3 ¡Ya puedes cerrar el navegador! `));

                        }

                        validateAndCountGrupos();
                        // enviarMnsGrupos();


                    }
                    selectGroupsMkting();

                }

                function seleccionarGruposMKTing() {
                    // Pendiente

                }

                //listo 
                async function seleccionarArchivoMKTing() {
                    rl.removeAllListeners('line');
                    parametroPython = '--mktimg 0';
                    console.log(`${espacioPreguntas}   ${colors.yellow('└ Esperando a com para Cambiar imagen')}`);
                    try {
                        const output = await exePython(parametroPython);
                        console.log(`${espacioPreguntas}   ${colors.yellow('   └ ' + output)}`);
                        chicasMKTing();

                    } catch (error) {
                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                    }
                }

                // Listo
                async function mensajeMKTing() {
                    rl.removeAllListeners('line');
                    parametroPython = '--mktmns 0';
                    console.log(`${espacioPreguntas}   ${colors.yellow('   └ Esperando a com para Cambiar Mensaje')}`);
                    try {
                        const output = await exePython(parametroPython);
                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                        chicasMKTing();

                    } catch (error) {
                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                    }
                }

                // Mostrar el menú inicial
                function iniMenuVentas() {
                    rl.removeAllListeners('line');
                    console.log(colors.yellow(`${espacioPreguntas}Menú MKTing`));
                    console.log(colors.cyan(`${espacioPreguntas}1. Enviar ahora`));
                    console.log(colors.cyan(`${espacioPreguntas}2. Selecciona Grupos (Pendiente)`));
                    console.log(colors.cyan(`${espacioPreguntas}3. Seleccionar Archivo`));
                    console.log(colors.cyan(`${espacioPreguntas}4. Cambiar Mensaje`));
                    rl.setPrompt(`${espacioPreguntas}${colors.bgYellow.black('   MKTing > ')}`);
                    rl.prompt();

                    rl.on('line', (input) => {
                        switch (input.trim()) {
                            case '1':
                                enviarMKTing();
                                break;
                            case '2':
                                seleccionarGruposMKTing();
                                break;
                            case '3':
                                seleccionarArchivoMKTing();
                                break;
                            case '4':
                                mensajeMKTing();
                                break;
                            default:
                                console.log(colors.red.bold(`   ${espacioPreguntas}Opción no válida. Por favor, inténtalo de nuevo.`));
                                rl.prompt();
                        }
                    }).on('close', () => {
                        console.log('¡Adiós!');

                        // Manejadores de señales para limpiar procesos antes de salir
                        process.on('SIGINT', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });

                        process.on('SIGTERM', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });
                        process.exit(0);

                    });
                }

                iniMenuVentas();
            }



            /*
                Chicas de Ventas 
                    - Envio de mensajes por Etiquetas
            */
            function chicasVentas() {
                let mnsBienvenida = colors.yellow(`
    ───▄▀▀▀▄▄▄▄▄▄▄▀▀▀▄───
    ───█▒▒░░░░░░░░░▒▒█───
    ────█░░█░░░░░█░░█────
    ─▄▄──█░░░▀█▀░░░█──▄▄─
    █░░█─▀▄░░░░░░░▄▀─█░░█
    Envía mensajes a tus clientes de una manera más rápida.`);

                function enviarVentas() {
                    async function asesorVentas() {

                        rl.removeAllListeners('line');
                        console.log('Ventas iniciado...');
                        try {
                            console.log(colors.green(`${espacioPreguntas}>_ Obteniendo las Etiquetas, espera un momento`));
                            console.clear();
                            // console.log(colors.blue(`${espacioPreguntas}Cliente listo!`));
                            console.log(mnsBienvenida);

                            const etiquetasClientes = await client.getLabels();
                            const etiquetasMenu = etiquetasClientes.map((label, index) => ({
                                index: index + 1,
                                name: label.name,
                                id: label.id
                            }));

                            console.log(`${espacioPreguntas}Selecciona una etiqueta:`);
                            const contactos = await client.getContacts();

                            // Recorremos cada etiqueta y contamos los contactos asociados
                            let duplicadosNumeros = [];
                            let contactosClientesDuplicados = 0;
                            for (const label of etiquetasMenu) {
                                const contactosEtiquetados = contactos.filter(contacto =>
                                    contacto.labels && contacto.labels.includes(label.id)
                                );

                                const contactosClientes = contactosEtiquetados.length;

                                if (contactosEtiquetados.length > 0) {
                                    if (contactosEtiquetados.length > 0) {
                                        try {

                                            const fechaActualComparacion = new Date().toLocaleString('es-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                weekday: 'long',
                                            });

                                            async function processItems() {
                                                let duplicadosNumeros = [];
                                                for (const item of contactosEtiquetados) {
                                                    let numerClienteArray = item.number;
                                                    const row = await new Promise((resolve, reject) => {
                                                        db.get(
                                                            `SELECT * FROM clientes 
                                                         WHERE numeroLimpio = ? 
                                                         ORDER BY id DESC 
                                                         LIMIT 1`,
                                                            numerClienteArray,
                                                            (err, row) => {
                                                                if (err) {
                                                                    reject(err);
                                                                } else {
                                                                    resolve(row);
                                                                }
                                                            }
                                                        );
                                                    });

                                                    if (row) {
                                                        const fechaLibre = row.fecha;
                                                        const fechaRow = fechaLibre.split(', ').slice(0, 2).join(', ');

                                                        if (fechaRow === fechaActualComparacion) {
                                                            // console.log(item);

                                                        } else {
                                                            // console.log(`${item} esta en la base pero no tiene la fecha\nFECHA AHORA: ${fechaActualComparacion}\nFecha de Row: ${fechaRow}`);
                                                            duplicadosNumeros.push(item);

                                                        }
                                                    } else {
                                                        // console.log(numerClienteArray + ' - ' + false);
                                                        duplicadosNumeros.push(item);
                                                    }

                                                }

                                                return duplicadosNumeros;
                                            }

                                            async function main() {
                                                try {
                                                    const duplicadosNumeros = await processItems();
                                                    contactosClientesDuplicados = duplicadosNumeros.length;
                                                    let mensajeEtiquetasClientes = '';
                                                    if (contactosClientesDuplicados >= 1) {
                                                        mensajeEtiquetasClientes = `${contactosClientesDuplicados} contacto${contactosClientesDuplicados > 1 ? 's' : ''}`;
                                                        console.log(colors.yellow(`   ${espacioPreguntas}${label.index}. ${label.name} (${mensajeEtiquetasClientes})`));
                                                        const textoEtiqueta = `${label.index}. ${label.name} (${mensajeEtiquetasClientes})`;
                                                        etiquetasCreadas.push(textoEtiqueta);

                                                    } else if (contactosClientesDuplicados === 0) {
                                                        mensajeEtiquetasClientes = `${contactosClientesDuplicados} contactos`;
                                                        console.log(colors.red(`   ${espacioPreguntas}${label.index}. ${label.name} ${colors.bgRed.white('(Sin Contactos)')}`));
                                                        const textoEtiqueta = `${label.index}. ${label.name} (${mensajeEtiquetasClientes})`;
                                                        etiquetasCreadas.push(textoEtiqueta);


                                                    }
                                                } catch (error) {
                                                    console.error(error);
                                                }
                                            }

                                            await main();

                                        } catch (err) {
                                            console.error('Error al consultar la base de datos:', err);
                                        }
                                    } else {
                                        console.log(`No hay contactos etiquetados para la etiqueta: ${label.name}`);
                                    }
                                } else {
                                    console.log(colors.red(`   ${espacioPreguntas}${label.index}. ${label.name} ${colors.bgRed.white('(Sin Contactos)')}`));

                                }
                            }




                            const preguntarEtiqueta = async() => {
                                console.log(colors.cyan(`   ${espacioPreguntas}ini. Volver al menú`));
                                rl.question(`${espacioPreguntas}Introduce el número de la etiqueta seleccionada: `, async(respuesta) => {
                                    const seleccion = etiquetasMenu.find(label => label.index == respuesta);
                                    if (respuesta === 'ini') {
                                        console.clear();
                                        console.log(mnsBienvenida);
                                        iniMenuVentas();

                                    } else {
                                        if (seleccion) {
                                            const indiceBuscado = `${seleccion.index}. ${seleccion.name}`;
                                            const textoCompleto = etiquetasCreadas.find(etiqueta => etiqueta.startsWith(`${indiceBuscado}`));
                                            if (textoCompleto.includes('0 contactos')) {
                                                console.log(colors.red.bold(`${espacioPreguntas}Elegiste una etiqueta que no tiene numeros disponibles para enviar`));
                                                preguntarEtiqueta();

                                            } else {
                                                console.log(`    > Has seleccionado la etiqueta: ${colors.green(seleccion.name)}`);
                                                const contactosEtiquetados = contactos.filter(contacto =>
                                                    contacto.labels && contacto.labels.includes(seleccion.id)
                                                );

                                                async function processItems() {
                                                    let duplicadosNumeros = [];
                                                    const fechaActualComparacion = new Date().toLocaleString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        weekday: 'long',
                                                    });
                                                    for (const item of contactosEtiquetados) {
                                                        let numerClienteArray = item.number;
                                                        const row = await new Promise((resolve, reject) => {
                                                            db.get(
                                                                `SELECT * FROM clientes 
                                                         WHERE numeroLimpio = ? 
                                                         ORDER BY id DESC 
                                                         LIMIT 1`,
                                                                numerClienteArray,
                                                                (err, row) => {
                                                                    if (err) {
                                                                        reject(err);
                                                                    } else {
                                                                        resolve(row);
                                                                    }
                                                                }
                                                            );
                                                        });

                                                        if (row) {
                                                            const fechaLibre = row.fecha;
                                                            const fechaRow = fechaLibre.split(', ').slice(0, 2).join(', ');

                                                            if (fechaRow === fechaActualComparacion) {
                                                                // console.log(item);

                                                            } else {
                                                                // console.log(`${item} esta en la base pero no tiene la fecha\nFECHA AHORA: ${fechaActualComparacion}\nFecha de Row: ${fechaRow}`);
                                                                duplicadosNumeros.push(item);

                                                            }
                                                        } else {
                                                            // console.log(numerClienteArray + ' - ' + false);
                                                            duplicadosNumeros.push(item);
                                                        }

                                                    }

                                                    return duplicadosNumeros;
                                                }

                                                const duplicadosNumeros = await processItems();
                                                if (duplicadosNumeros.length > 0) {
                                                    function mostrarMenu() {
                                                        // Preguntar la cantidad de mensajes que queremos enviar
                                                        let numeroClientesEtiqueta = duplicadosNumeros.length;
                                                        if (numeroClientesEtiqueta <= 100) {
                                                            console.log('           ' + colors.bgMagenta.white(`Se envian los mns automaticamente`));
                                                            /*
                                                                        Activar solamente cuando estemos en produccion
                                                                        Este proceso lo que hace es enviar los mensaje automaticamente
                                                                        porque el numero de clientes es menor a 100
                    
                                                                        sendMessagesCompletSteps(opcion);
                                                                    */
                                                            askMensajes();

                                                        } else if (numeroClientesEtiqueta >= 100) {
                                                            askMensajes();


                                                        }


                                                        async function askMensajes() {
                                                            console.log(`           ${espacioPreguntas}Cuantos mensajes quieres envia? (${colors.green(numeroClientesEtiqueta)})`);
                                                            rl.question(`           ${espacioPreguntas}Seleccione una numero: `, (opcion) => {
                                                                if (opcion > numeroClientesEtiqueta) {
                                                                    console.log(`           ${espacioPreguntas}El numero que escogiste supera al numero de Clientes`);
                                                                    console.log(`              ${espacioPreguntas} ${colors.bgRed.white('El numero que escogiste supera al numero de Clientes')}\n`);
                                                                    askMensajes();

                                                                } else {
                                                                    console.log(`           ${espacioPreguntas}Espera un momento...`);
                                                                    sendMessagesCompletSteps(opcion);
                                                                }
                                                            });
                                                        }


                                                        function sendMessagesCompletSteps(numeroMensajes) {
                                                            let rutaMns = 'app/ventas/mns.txt';
                                                            let ruta = 'app/ventas/files.json';
                                                            let nombreCliente = 'Ventas';
                                                            fs.readFile(rutaMns, 'utf8', (err, data) => {
                                                                if (err) {
                                                                    console.error(err);
                                                                    return;
                                                                }

                                                                const nuevoObjeto = {
                                                                    label: seleccion.name,
                                                                    mns: rutaMns,
                                                                    file: ruta,
                                                                    tipoCliente: nombreCliente
                                                                };

                                                                opcionesCreada.push(nuevoObjeto);
                                                                const labelArray = opcionesCreada[0].label;
                                                                const mnsArray = opcionesCreada[0].mns;
                                                                const fileArray = opcionesCreada[0].file;
                                                                const tipoClienteArray = opcionesCreada[0].tipoCliente;


                                                                console.log(`
        ${colors.bgWhite.black('RESUMEN DE ENVIO')}
        - Clientes con Etiqueta: ${colors.yellow(labelArray)}
        ${fileArray.length > 0 ? '- Archivo: ' + colors.yellow(fileArray) + '' : '- Archivo: ' + colors.yellow('N/A') + ''}
        - Tipo de Clientes: ${colors.yellow(tipoClienteArray)}
        - Mensaje: ${colors.yellow(data)}
                                                                            `);

                                                                async function mostrarAlert() {
                                                                    rl.question(colors.yellow(`${espacioPreguntas}Estas seguro de enviar mensajes masivos ahora? (s/n): `), async(opcion) => {
                                                                        if (opcion === 's' || opcion === 'S') {
                                                                            console.log(`\n    ${colors.bgYellow.black('>_ Enviando mensajes en 2s')}`);
                                                                            console.log(`       Enviaremos mensajes a clientes con la etiqueta ${colors.green(seleccion.name)}`);
                                                                            const primerosTresNumeros = duplicadosNumeros.slice(0, numeroMensajes);
                                                                            let conteo = 0;



                                                                            // Aqui van los numeros
                                                                            let cicloMensaje = 1;

                                                                            for (let grupo of primerosTresNumeros) {
                                                                                const fechaActual = new Date().toLocaleString('es-ES', {
                                                                                    hour: 'numeric',
                                                                                    minute: 'numeric',
                                                                                    hour12: true,
                                                                                    day: 'numeric',
                                                                                    month: 'long',
                                                                                    year: 'numeric',
                                                                                    weekday: 'long',
                                                                                });
                                                                                let numeroClienteBase = grupo.number + '@c.us';

                                                                                let numeroClienteBaseLibre = grupo.number;
                                                                                if (data === '' || data === ' ') {
                                                                                    console.log('No se puede eniar el mensaje, Escribe un mensaje ara continuar');

                                                                                } else {
                                                                                    try {
                                                                                        const jsonPath = 'app/ventas/files.json';
                                                                                        const data = fs.readFileSync(jsonPath, 'utf8');
                                                                                        const fileArray = JSON.parse(data);
                                                                                        let imageCount = 0;

                                                                                        // Contar el número total de imágenes
                                                                                        for (let obj of fileArray) {
                                                                                            if (obj.hasOwnProperty('mns')) {
                                                                                                imageCount += obj['mns'].length;
                                                                                            }
                                                                                        }

                                                                                        let currentImage = 1;
                                                                                        for (let obj of fileArray) {
                                                                                            if (obj.hasOwnProperty('mns')) {
                                                                                                for (let file of obj['mns']) {
                                                                                                    const extension = file.split('.').pop();
                                                                                                    if (file === '' || file === ' ') {
                                                                                                        console.log(`    ${colors.bgYellow.black('Se Enviara Texto')}`);
                                                                                                        console.log(`    ${colors.bgRed.white('Debes seleccionar al menos una imagen para continuar...')}`);

                                                                                                    } else {
                                                                                                        if (extension === 'png' || extension === 'jpg') {
                                                                                                            console.log(`${espacioPreguntas}      ■ Imagen: ` + colors.cyan(`${file}`));
                                                                                                            const media = MessageMedia.fromFilePath(file);
                                                                                                            await client.sendMessage(numeroClienteBase, media)
                                                                                                                .then(() => {
                                                                                                                    // console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroClienteBaseLibre} Mensajes (${cicloMensaje} de ${numeroMensajes})`));
                                                                                                                    console.log(colors.green(`                 └ ✔  Imagen ${currentImage} de ${imageCount} Enviada a ${numeroClienteBaseLibre}`));
                                                                                                                    insertarRegistro(numeroClienteBaseLibre, 'Imagen', fechaActual, true, labelArray);
                                                                                                                })
                                                                                                                .catch((error) => {
                                                                                                                    // console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroClienteBaseLibre} Mensajes (${cicloMensaje} de ${numeroMensajes})`));
                                                                                                                    console.log(colors.green(`                 └ ×  Imagen ${currentImage} de ${imageCount} No Enviada a ${numeroClienteBaseLibre}`));
                                                                                                                    insertarRegistro(numeroClienteBaseLibre, 'Imagen', fechaActual, false, labelArray);
                                                                                                                });

                                                                                                            await delayWithCountdown(4000); // Esperar 8 segundos entre cada imagen
                                                                                                            console.log(`\n`);

                                                                                                        } else if (extension === 'mp3') {
                                                                                                            console.log(`${espacioPreguntas}      ■ Audio: ` + colors.cyan(`${file}`));
                                                                                                            const media = MessageMedia.fromFilePath(file);
                                                                                                            await client.sendMessage(numeroClienteBase, media)
                                                                                                                .then(() => {
                                                                                                                    // console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroClienteBaseLibre} Mensajes (${cicloMensaje} de ${numeroMensajes})`));
                                                                                                                    console.log(colors.green(`                 └ ✔  Mp3/Audio ${currentImage} de ${imageCount} Enviada a ${numeroClienteBaseLibre}`));
                                                                                                                    insertarRegistro(numeroClienteBaseLibre, 'Audio', fechaActual, true, labelArray);
                                                                                                                })
                                                                                                                .catch((error) => {
                                                                                                                    // console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroClienteBaseLibre} Mensajes (${cicloMensaje} de ${numeroMensajes})`));
                                                                                                                    console.log(colors.green(`                 └ ×  Mp3/Audio ${currentImage} de ${imageCount} No Enviada a ${numeroClienteBaseLibre}`));
                                                                                                                    insertarRegistro(numeroClienteBaseLibre, 'Audio', fechaActual, false, labelArray);
                                                                                                                });

                                                                                                            await delayWithCountdown(4000); // Esperar 8 segundos entre cada imagen
                                                                                                            console.log(`\n`);

                                                                                                        } else if (extension === 'pdf') {
                                                                                                            console.log(`${espacioPreguntas}      ■ PDF: ` + colors.cyan(`${file}`));
                                                                                                            const media = MessageMedia.fromFilePath(file);
                                                                                                            await client.sendMessage(numeroClienteBase, media)
                                                                                                                .then(() => {
                                                                                                                    // console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroClienteBaseLibre} Mensajes (${cicloMensaje} de ${numeroMensajes})`));
                                                                                                                    console.log(colors.green(`                 └ ✔  PDF ${currentImage} de ${imageCount} Enviada a ${numeroClienteBaseLibre}`));
                                                                                                                    insertarRegistro(numeroClienteBaseLibre, 'PDF', fechaActual, true, labelArray);
                                                                                                                })
                                                                                                                .catch((error) => {
                                                                                                                    // console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroClienteBaseLibre} Mensajes (${ciclo} de ${numeroMensajes})`));
                                                                                                                    console.log(colors.green(`                 └ ×  PDF ${currentImage} de ${imageCount} No Enviada a ${numeroClienteBaseLibre}`));
                                                                                                                    insertarRegistro(numeroClienteBaseLibre, 'PDF', fechaActual, false, labelArray);
                                                                                                                });

                                                                                                            await delayWithCountdown(4000); // Esperar 8 segundos entre cada imagen
                                                                                                            console.log(`\n`);

                                                                                                        }
                                                                                                        currentImage++;
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }

                                                                                    } catch (err) {
                                                                                        console.error(`Error al leer o parsear el archivo JSON: ${err.message}`);
                                                                                    }

                                                                                    console.log(`${espacioPreguntas}      ■ Mensaje: ` + colors.cyan(`${data}`));


                                                                                    const palabrasClave = [
                                                                                        "Leads", "lead", "Mayoristas", "intermoda", "cliente",
                                                                                        "im1", "im2", "im3", "im4", "im5", "im6",
                                                                                        "ventas",
                                                                                        "choys",


                                                                                        "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
                                                                                        "Chihuahua", "Coahuila", "Colima", "Ciudad de México", "Durango", "Guanajuato",
                                                                                        "Guerrero", "Hidalgo", "Jalisco", "Estado de México", "Michoacán", "Morelos",
                                                                                        "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo",
                                                                                        "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala",
                                                                                        "Veracruz", "Yucatán", "Zacatecas"
                                                                                    ];
                                                                                    let numeroNombre = await obtenerNombreContacto(numeroClienteBase);
                                                                                    let nombresLimpios = limpiarNombre(numeroNombre);

                                                                                    function limpiarNombre(nombre) {
                                                                                        nombre = nombre.replace(/\(.*?\)/g, '');
                                                                                        let regexPalabras = new RegExp(palabrasClave.join("|"), "gi");
                                                                                        nombre = nombre.replace(regexPalabras, '');
                                                                                        nombre = nombre.replace(/\b[A-Za-z]*\d+[A-Za-z]*\b/g, '');
                                                                                        return nombre.replace(/[^a-zA-Z\s]/g, '').trim();

                                                                                    }

                                                                                    if (nombresLimpios.length === 0) {
                                                                                        let mensajePersonalizado = data.replace('%u%', '👋');
                                                                                        console.log(mensajePersonalizado);
                                                                                        await client.sendMessage(numeroClienteBase, mensajePersonalizado)
                                                                                            .then(() => {
                                                                                                console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroClienteBaseLibre} Mensajes (${cicloMensaje} de ${numeroMensajes})`));
                                                                                                insertarRegistro(numeroClienteBaseLibre, 'Texto', fechaActual, true, labelArray);
                                                                                            })
                                                                                            .catch((error) => {
                                                                                                console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroClienteBaseLibre} Mensajes (${cicloMensaje} de ${numeroMensajes})`));
                                                                                                insertarRegistro(numeroClienteBaseLibre, 'Texto', fechaActual, false, labelArray);
                                                                                            });
                                                                                        await delayWithCountdown(7000); // Esperar 20 segundos antes de pasar al siguiente grupo
                                                                                        console.log(`\n\n`);
                                                                                        cicloMensaje++

                                                                                    } else {
                                                                                        let mensajePersonalizado = data.replace('%u%', `*${nombresLimpios}*`);
                                                                                        console.log(mensajePersonalizado);
                                                                                        await client.sendMessage(numeroClienteBase, mensajePersonalizado)
                                                                                            .then(() => {
                                                                                                console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroClienteBaseLibre} Mensajes (${cicloMensaje} de ${numeroMensajes})`));
                                                                                                insertarRegistro(numeroClienteBaseLibre, 'Texto', fechaActual, true, labelArray);
                                                                                            })
                                                                                            .catch((error) => {
                                                                                                console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroClienteBaseLibre} Mensajes (${cicloMensaje} de ${numeroMensajes})`));
                                                                                                insertarRegistro(numeroClienteBaseLibre, 'Texto', fechaActual, false, labelArray);
                                                                                            });
                                                                                        await delayWithCountdown(7000); // Esperar 20 segundos antes de pasar al siguiente grupo
                                                                                        console.log(`\n\n`);
                                                                                        cicloMensaje++

                                                                                    }
                                                                                }
                                                                            }

                                                                            // Obtener el nombre del cliente si esta o no registrado
                                                                            async function obtenerNombreContacto(numeroClienteBase) {
                                                                                try {
                                                                                    const contacto = await client.getContactById(numeroClienteBase);
                                                                                    if (contacto) {
                                                                                        console.log(contacto.pushname);
                                                                                        console.log(contacto.name);
                                                                                        console.log(contacto.verifiedName);
                                                                                        return contacto.name || '';

                                                                                    } else {
                                                                                        throw new Error(`No se encontró un contacto registrado con el número ${numeroClienteBase}.`);
                                                                                    }
                                                                                } catch (error) {
                                                                                    console.error('Error al obtener el contacto:', error);
                                                                                    throw error;
                                                                                }
                                                                            }

                                                                            notifier.notify({
                                                                                title: 'Ventas Terminamos 🎉',
                                                                                message: `Se enviaron las imagenes y mensaje a los clientes con etiqueta ${labelArray} 🤩`,
                                                                                icon: './src/logo.png',

                                                                            });
                                                                            iniMenuVentas();


                                                                        } else if (opcion === 'n' || opcion === 'N') {
                                                                            opcionesCreada = [];
                                                                            rl.close();
                                                                            asesorVentas();

                                                                        } else {
                                                                            console.log(colors.red('    >_ Selección inválida.'));
                                                                            mostrarAlert();
                                                                        }
                                                                    });
                                                                }

                                                                mostrarAlert();

                                                                // Función de ayuda para esperar con cuenta regresiva
                                                                async function delayWithCountdown(ms) {
                                                                    for (let i = ms / 1000; i > 0; i--) {
                                                                        process.stdout.write(`    ${espacioPreguntas}      ` + colors.bgMagenta.white(`Esperando ${i}...  \r`));
                                                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                                                    }
                                                                    process.stdout.write('\n');
                                                                }

                                                                // console.log(data);
                                                            });

                                                        }
                                                    }

                                                    // Función para obtener la ruta de archivo basada en la elección del usuario
                                                    function obtenerRuta(opcion) {
                                                        switch (opcion) {
                                                            case '1':
                                                                return dataTipoCliente[0].leads;
                                                            case '2':
                                                                return dataTipoCliente[0].labis;
                                                            case '3':
                                                                return dataTipoCliente[0].mayor;
                                                            case '4':
                                                                return dataTipoCliente[0].depar;
                                                            default:
                                                                return null;
                                                        }
                                                    }

                                                    // Lógica principal
                                                    mostrarMenu();

                                                } else {
                                                    console.log(`    > No hay contactos en la etiqueta: ${colors.red(seleccion.name)}`);
                                                    rl.close();

                                                    await asesorVentas();
                                                    console.log('errooooo');

                                                }

                                            }







                                        } else {
                                            console.log(colors.red(`    >_ Selección inválida.`));
                                            rl.close();
                                            preguntarEtiqueta();

                                        }
                                    }
                                });
                            }

                            // Inicializa el proceso de pregunta e imprime las etiquetas una sola vez
                            // imprimirEtiquetas();
                            preguntarEtiqueta();
                        } catch (error) {
                            console.error('Error al obtener etiquetas:', error);
                        }
                    }

                    asesorVentas();

                }

                // Listo
                async function mensajeVentas() {
                    rl.removeAllListeners('line');

                    console.log(`${espacioPreguntas}${colors.yellow('   └ Esperando a com para Cambiar Mensaje')}`);
                    parametroPython = '--clmns 0';
                    try {
                        const output = await exePython(parametroPython);
                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                        chicasVentas();

                    } catch (error) {
                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                    }


                }

                function elimnarDb() {
                    const sql = 'DELETE FROM clientes';
                    db.run(sql, [], function(err) {
                        if (err) {
                            console.error(colors.red(`${espacioPreguntas}Error al eliminar los datos de la tabla clientes: ${err.message}`));
                            rl.removeAllListeners('line');
                            chicasVentas();

                        } else {
                            console.log(colors.cyan(`${espacioPreguntas}Se eliminaron todos los datos de la tabla clientes`));
                            rl.removeAllListeners('line');
                            chicasVentas();

                        }

                    });
                }

                function iniMenuVentas() {
                    rl.removeAllListeners('line');
                    console.log(mnsBienvenida);
                    console.log(colors.yellow(`${espacioPreguntas}Menú Ventas`));
                    console.log(colors.cyan(`${espacioPreguntas}1. Enviar ahora`));
                    console.log(colors.cyan(`${espacioPreguntas}2. Opciones de mensaje`));
                    console.log(colors.cyan(`${espacioPreguntas}3. Limpiar base de datos`));
                    rl.setPrompt(`${espacioPreguntas}${colors.bgYellow.black('   Ventas > ')}`);
                    rl.prompt();

                    rl.on('line', (input) => {
                        switch (input.trim()) {
                            case '1':
                                enviarVentas();
                                break;
                            case '2':
                                mensajeVentas();
                                break;
                            case '3':
                                elimnarDb();
                                break;
                            default:
                                console.log('Opción no válida. Por favor, inténtalo de nuevo.');
                                rl.prompt();
                        }
                    }).on('close', () => {
                        console.log('¡Adiós!');

                        // Manejadores de señales para limpiar procesos antes de salir
                        process.on('SIGINT', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });

                        process.on('SIGTERM', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });
                        process.exit(0);

                    });

                }

                iniMenuVentas();
            }


            /*
                Chicas de Ventas 
                    - Envio de mensajes Cobranza
            */
            function CobranzaFinanzas() {
                // Función para mostrar el menú de ventas
                function enviarCobranzas() {
                    rl.removeAllListeners('line');

                    function readExcelFile(filePath) {
                        const workbook = xlsx.readFile(filePath);
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
                        const rows = [];
                        for (let i = 1; i < data.length; i++) {
                            const row = data[i];
                            const nombre = row[0];
                            const fechaCorte = row[2];
                            const cantidad = row[3];
                            const pago = row[4];
                            const numero = row[5];
                            const order = row[7];

                            if (pago === 'false') {
                                rows.push({
                                    Nombre: nombre,
                                    FechaCorte: fechaCorte,
                                    Cantidad: cantidad,
                                    Pago: pago,
                                    Numero: numero,
                                    Order: order
                                });
                            }
                        }
                        return rows;

                    }

                    function readTextFile(filePath) {
                        return fs.readFileSync(filePath, 'utf8');

                    }

                    function convertirNumeroALetras(numero) {
                        let palabras = numeros.numero2word(numero).Capitalize().toString();
                        palabras = palabras.replace(/([A-Za-z])mil/g, '$1 mil');
                        palabras = palabras.replace(/(\d+) (centavos?)/, (_, num, centavos) => {
                            return `${num} ${centavos.charAt(0).toUpperCase()}${centavos.slice(1)}`;

                        });

                        return palabras;
                    }

                    function convertirFechaExcel(fechaExcel) {
                        const fecha = new Date(Math.round((fechaExcel - 25569) * 86400 * 1000));
                        const dia = fecha.getDate().toString().padStart(2, '0');
                        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Los meses son de 0 a 11
                        const año = fecha.getFullYear();
                        return `${dia}/${mes}/${año}`;

                    }

                    function replacePlaceholders(message, user, pay, fechaCorte, fechaPedido, numero, orderPedido) {
                        const formattedPay = pay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        const payInWords = convertirNumeroALetras(pay);
                        console.log(orderPedido);
                        return message
                            .replace('%user%', `*${user}*`)
                            .replace('%pay%', `*$${formattedPay} MXN (${payInWords})*`)
                            .replace('%order%', `*${orderPedido}*`)
                            .replace('%date%', `*${fechaCorte}*`);

                    }

                    function cobranzaModulo() {
                        const excelFilePath = 'app/finanzas/finanzas.xlsx';
                        const textFilePath = 'app/finanzas/mns/mns.txt';

                        try {
                            const rows = readExcelFile(excelFilePath);
                            console.log(rows);



                            const messageTemplate = readTextFile(textFilePath);
                            console.log(`    ${colors.bgYellow.black(' Se comienza el envio de mensaje a los Clientes que tienen pagos pendientes ')}`);
                            let duplicadosNumeros = [];

                            async function processRows(rows) {
                                for (let i = 0; i < rows.length; i++) {
                                    const row = rows[i];
                                    const rowNumeroBase = String(row.Numero);
                                    try {
                                        const rowx = await new Promise((resolve, reject) => {
                                            db.get(
                                                `SELECT * FROM clientes 
                                                 WHERE numeroLimpio = ? 
                                                 ORDER BY id DESC 
                                                 LIMIT 1`,
                                                rowNumeroBase,
                                                (err, row) => {
                                                    if (err) {
                                                        reject(err);

                                                    } else {
                                                        resolve(row);

                                                    }
                                                }
                                            );
                                        });

                                        if (rowx) {
                                            const fechaLibre = rowx.fecha;
                                            console.log(rowx);
                                            const fechaRow = fechaLibre.split(', ').slice(0, 2).join(', ');
                                            const fechaActualComparacion = new Date().toLocaleString('es-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                weekday: 'long',
                                            });

                                            if (fechaRow === fechaActualComparacion) {
                                                // No code

                                            } else {
                                                duplicadosNumeros.push(row);

                                            }
                                        } else {
                                            duplicadosNumeros.push(row);

                                        }
                                    } catch (error) {
                                        console.error(`Error processing row ${i}:`, error);
                                    }
                                }

                                let rowLengthDuplicados = duplicadosNumeros.length;
                                if (rowLengthDuplicados <= 0) {
                                    console.log(`    ${colors.bgCyan.black(' Se enviaron mensaje a todos los Clientes con pago pendiente ')}`);

                                } else {
                                    duplicadosNumeros.forEach((dupRow, index) => {
                                        if (mensaje === '' || mensaje === ' ') {
                                            console.log('No se puede eniar el mensaje, Escribe un mensaje para continuar');

                                        } else {
                                            setTimeout(() => {
                                                const fechaActual = new Date().toLocaleString('es-ES', {
                                                    hour: 'numeric',
                                                    minute: 'numeric',
                                                    hour12: true,
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    weekday: 'long',
                                                });

                                                const fechaPedido = convertirFechaExcel(dupRow.FechaPedido);
                                                const fechaCorte = convertirFechaExcel(dupRow.FechaCorte);
                                                const personalizedMessage = replacePlaceholders(
                                                    messageTemplate,
                                                    dupRow.Nombre,
                                                    dupRow.Cantidad,
                                                    fechaCorte,
                                                    fechaPedido,
                                                    dupRow.Numero,
                                                    dupRow.Order
                                                );

                                                const numeroForClienteFinanzas = `${dupRow.Numero}@c.us`;
                                                const numeroForClienteFinanzasLibre = `${dupRow.Numero}`;
                                                client.sendMessage(numeroForClienteFinanzas, personalizedMessage)
                                                    .then(() => {
                                                        console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForClienteFinanzasLibre} Mensajes (${index + 1} de ${rowLengthDuplicados})`));
                                                        insertarRegistro(numeroForClienteFinanzasLibre, 'Texto', fechaActual, true, 'Finanzas');
                                                    })
                                                    .catch((error) => {
                                                        console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroForClienteFinanzasLibre} Mensajes (${index + 1} de ${rowLengthDuplicados})`));
                                                        insertarRegistro(numeroForClienteFinanzasLibre, 'Texto', fechaActual, false, 'Finanzas');
                                                    });
                                            }, index * 20000);
                                        }
                                    });

                                    // notifier.notify({
                                    //     title: 'Cobros Terminamos 🎉',
                                    //     message: `Se enviaron los mensajes a los clientes 🤩`,
                                    //     icon: './src/logo.png',

                                    // });

                                }

                            }

                            // Llamar a la función principal
                            processRows(rows).then(() => {});
                        } catch (error) {
                            console.error('Error:', error);
                        }
                    }

                    cobranzaModulo();
                }

                //listo 
                function seleccionarArchivo() {
                    rl.removeAllListeners('line');
                    console.log(colors.yellow(`\n${espacioPreguntas}Seleccionar Archivo Para: `));
                    console.log(colors.cyan(`${espacioPreguntas}1. Leads`));
                    console.log(colors.cyan(`${espacioPreguntas}2. Labis`));
                    console.log(colors.cyan(`${espacioPreguntas}3. Boutique`));
                    console.log(colors.cyan(`${espacioPreguntas}4. Departamentales`));
                    console.log(colors.cyan(`${espacioPreguntas}ini. Volver al menú`));
                    rl.setPrompt(`${espacioPreguntas}${colors.bgYellow.black('   Cobranza > Archivo tipo clientes > ')}`);
                    rl.prompt();

                    rl.on('line', async(input) => {
                        if (input === 'ini') {
                            CobranzaFinanzas();

                        } else {
                            console.log(`${espacioPreguntas}${colors.yellow('   └ Esperando a com para Cambiar Imagen')}`);
                            switch (input.trim()) {
                                case '1':
                                    parametroPython = '--cobimg 0';
                                    try {
                                        const output = await exePython(parametroPython);
                                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                                        CobranzaFinanzas();

                                    } catch (error) {
                                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                                    }
                                    break;
                                case '2':
                                    parametroPython = '--cobimg 1';
                                    try {
                                        const output = await exePython(parametroPython);
                                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                                        CobranzaFinanzas();

                                    } catch (error) {
                                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                                    }
                                    break;
                                case '3':
                                    parametroPython = '--cobimg 2';
                                    try {
                                        const output = await exePython(parametroPython);
                                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                                        CobranzaFinanzas();

                                    } catch (error) {
                                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                                    }
                                    break;
                                case '4':
                                    parametroPython = '--cobimg 3';
                                    try {
                                        const output = await exePython(parametroPython);
                                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                                        CobranzaFinanzas();

                                    } catch (error) {
                                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                                    }
                                    break;
                                default:
                                    // console.log('Opción no válida. Por favor, inténtalo de nuevo.');
                                    rl.prompt();
                            }
                        }
                    }).on('close', () => {
                        console.log('¡Adiós!');

                        // Manejadores de señales para limpiar procesos antes de salir
                        process.on('SIGINT', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });

                        process.on('SIGTERM', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });
                        process.exit(0);

                    });
                }

                // Listo
                function mensajeCobranza() {
                    rl.removeAllListeners('line');
                    console.log(colors.yellow(`\n${espacioPreguntas}Seleccionar Mensaje Para: `));
                    console.log(colors.cyan(`${espacioPreguntas}1. Leads`));
                    console.log(colors.cyan(`${espacioPreguntas}2. Labis`));
                    console.log(colors.cyan(`${espacioPreguntas}3. Boutique`));
                    console.log(colors.cyan(`${espacioPreguntas}4. Departamentales`));
                    console.log(colors.cyan(`${espacioPreguntas}ini. Volver al menú`));
                    rl.setPrompt(`${espacioPreguntas}${colors.bgYellow.black('   Cobranza > Mensaje tipo clientes > ')}`);
                    rl.prompt();

                    rl.on('line', async(input) => {
                        if (input === 'ini') {
                            CobranzaFinanzas();

                        } else {
                            switch (input.trim()) {
                                case '1':
                                    parametroPython = '--cobmns 0';
                                    console.log(`${espacioPreguntas}   ${colors.yellow('└ Esperando a com para Cambiar Mensaje')}`);
                                    try {
                                        const output = await exePython(parametroPython);
                                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                                        CobranzaFinanzas();

                                    } catch (error) {
                                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                                    }
                                    break;
                                case '2':
                                    parametroPython = '--cobmns 1';
                                    console.log(`${espacioPreguntas}   ${colors.yellow('└ Esperando a com para Cambiar Mensaje')}`);
                                    try {
                                        const output = await exePython(parametroPython);
                                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                                        CobranzaFinanzas();

                                    } catch (error) {
                                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                                    }
                                    break;
                                case '3':
                                    parametroPython = '--cobmns 2';
                                    console.log(`${espacioPreguntas}   ${colors.yellow('└ Esperando a com para Cambiar Mensaje')}`);
                                    try {
                                        const output = await exePython(parametroPython);
                                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                                        CobranzaFinanzas();

                                    } catch (error) {
                                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                                    }
                                    break;
                                case '4':
                                    parametroPython = '--cobmns 3';
                                    console.log(`${espacioPreguntas}   ${colors.yellow('└ Esperando a com para Cambiar Mensaje')}`);
                                    try {
                                        const output = await exePython(parametroPython);
                                        console.log(`${espacioPreguntas}   ${colors.yellow('└ ' + output)}`);
                                        CobranzaFinanzas();

                                    } catch (error) {
                                        console.error(`Error en seleccionarArchivoMKTing: ${error}`);
                                    }
                                    break;
                                default:
                                    console.log('Opción no válida. Por favor, inténtalo de nuevo.');
                                    rl.prompt();
                            }
                        }
                    }).on('close', () => {
                        console.log('¡Adiós!');

                        // Manejadores de señales para limpiar procesos antes de salir
                        process.on('SIGINT', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });

                        process.on('SIGTERM', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });
                        process.exit(0);

                    });
                }

                function iniMenuCobranza() {
                    rl.removeAllListeners('line');
                    // Mostrar el menú inicial
                    console.log(colors.yellow(`\n${espacioPreguntas}Menú Cobranzas `));
                    console.log(colors.cyan(`${espacioPreguntas}1. Enviar ahora`));
                    console.log(colors.cyan(`${espacioPreguntas}2. Seleccionar Archivo`));
                    console.log(colors.cyan(`${espacioPreguntas}3. Cambiar mensaje`));
                    rl.setPrompt(`${espacioPreguntas}${colors.bgYellow.black('   Cobranza > ')}`);
                    rl.prompt();

                    rl.on('line', (input) => {
                        switch (input.trim()) {
                            case '1':
                                enviarCobranzas();
                                break;
                            case '2':
                                seleccionarArchivo();
                                break;
                            case '3':
                                mensajeCobranza();
                                break;
                            default:
                                console.log('Opción no válida. Por favor, inténtalo de nuevo.');
                                rl.prompt();
                        }
                    }).on('close', () => {
                        console.log('¡Adiós!');

                        // Manejadores de señales para limpiar procesos antes de salir
                        process.on('SIGINT', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });

                        process.on('SIGTERM', async() => {
                            console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
                            await cleanUpProcesses();

                        });
                        process.exit(0);
                    });
                }

                iniMenuCobranza();
            }

            /* 
                Grupos Wichy
                    - Obtener los grupos y Contar el numero de mensajes
                    que mandan 1 Dia antes y lo que va del dia
            */
            async function obtenerGrupos() {
                // Obtener id de los grupos
                const groupIds = await getGroupIds();
                console.log('Group IDs:', groupIds);
                async function getGroupIds() {
                    const chats = await client.getChats();
                    const groupChats = chats.filter(chat => chat.isGroup);

                    const groupIds = groupChats.map(group => {
                        return {
                            name: group.name,
                            id: group.id._serialized
                        };
                    });

                    return groupIds;
                }
            }

            async function reaccionesGrupos() {
                const groupIds = getGroupIdsFromFile('app/grupos.json');
                await countMessagesFromGroups(groupIds);

                function getGroupIdsFromFile(filePath) {
                    try {
                        const data = fs.readFileSync(filePath, 'utf8');
                        const json = JSON.parse(data);
                        return json.groupIds;
                    } catch (err) {
                        console.error('Error reading group IDs from file:', err);
                        return [];
                    }
                }

                async function countMessagesFromGroups(groupIds) {
                    console.log(groupIds);
                    let totalMessageCount = 0;

                    for (const groupId of groupIds) {
                        const { name, count, details } = await countGroupMessages(groupId);
                        totalMessageCount += count;
                        console.log(colors.bgBlue(`Group "${name}": ${count} mensajes`));
                    }

                    console.log(colors.bgYellow.black((`Total: ${totalMessageCount} mensajes`)));
                }

                async function countGroupMessages(groupId) {
                    const chat = await client.getChatById(groupId);
                    const messages = await chat.fetchMessages({ limit: 1000 });
                    const excludedNumbers = [
                        '5214452157494@c.us',
                        '5214451233112@c.us',
                        '5214451450298@c.us',
                        '5214451453793@c.us',
                        '5214451224089@c.us',
                        '5214451224104@c.us',
                        '5214451354311@c.us',

                    ];

                    let messageCount = {};
                    let messageDetails = {};

                    messages.forEach(message => {
                        const senderNumber = message.author || message.from;
                        const messageDate = moment(message.timestamp * 1000);

                        const dateKey = messageDate.format('DD MMMM YYYY');
                        const today = moment().startOf('day');
                        const yesterday = moment().subtract(1, 'days').startOf('day');

                        if (!excludedNumbers.includes(senderNumber) && message.fromMe === false) {
                            if (messageDate.isBetween(yesterday, today, null, '[)')) {
                                if (!messageCount[yesterday.format('DD MMMM YYYY')]) {
                                    messageCount[yesterday.format('DD MMMM YYYY')] = new Set();
                                    messageDetails[yesterday.format('DD MMMM YYYY')] = [];
                                }
                                messageCount[yesterday.format('DD MMMM YYYY')].add(senderNumber);
                                messageDetails[yesterday.format('DD MMMM YYYY')].push({ number: senderNumber, message: message.body });
                            } else if (messageDate.isSame(today, 'day')) {
                                if (!messageCount[today.format('DD MMMM YYYY')]) {
                                    messageCount[today.format('DD MMMM YYYY')] = new Set();
                                    messageDetails[today.format('DD MMMM YYYY')] = [];
                                }
                                messageCount[today.format('DD MMMM YYYY')].add(senderNumber);
                                messageDetails[today.format('DD MMMM YYYY')].push({ number: senderNumber, message: message.body });
                            }
                        }
                    });

                    let count = 0;
                    for (let date in messageCount) {
                        count += messageCount[date].size;
                        console.log(colors.bgRed(`${date} - ${messageCount[date].size} mensajes`));
                        messageDetails[date].forEach(detail => {
                            // console.log(`    ${detail.number}: ${detail.message}`);
                        });
                    }

                    return { name: chat.name, count, details: messageDetails };
                }
            }


            function difucionesGruposVentas() {
                console.log('Difucion');
            }

            function main() {
                const settingsPath = path.join(__dirname, 'app/settings.json');
                fs.readFile(settingsPath, 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error leyendo el archivo:', err);
                        return;
                    }

                    const settings = JSON.parse(data);
                    const { selectGroups, ventas, finanzas, grupos, reacciones, dif } = settings[0];

                    // Mkting
                    if (selectGroups) {
                        console.log(colors.green(`${espacioPreguntas}Mkting iniciado...`));
                        chicasMKTing();

                    }

                    // Ventas
                    if (ventas) {
                        chicasVentas();

                    }

                    // Finanzas
                    if (finanzas) {
                        CobranzaFinanzas();

                    }

                    // Grupos
                    if (grupos) {
                        obtenerGrupos();

                    }

                    // Reacciones
                    if (reacciones) {
                        reaccionesGrupos();

                    }

                    // Difusiones
                    if (dif) {
                        difucionesGruposVentas();

                    }
                });
            }

            // Inicia el programa
            main();

        }





        askAsesor();

    });


    client.initialize();
}

verifyAndCopyChrome();


async function multiSession() {

    const sessionsInfo = JSON.parse(fs.readFileSync('app/grupos/grupos.json', 'utf-8'));
    const filesInfo = JSON.parse(fs.readFileSync('app/grupos/files.json', 'utf-8'));
    const sessionNames = Object.keys(sessionsInfo);
    const sessions = [];
    const availableColors = [
        colors.bgCyan.black,
        colors.bgYellow.black,
        colors.bgGreen.black,
        colors.bgMagenta.white,
        colors.bgRed.white
    ];
    const sessionColors = {};

    // Asignar colores aleatorios a cada sesión
    sessionNames.forEach(sessionName => {
        const randomColor = availableColors.splice(Math.floor(Math.random() * availableColors.length), 1)[0];
        sessionColors[sessionName] = randomColor;
    });

    await exec(`taskkill /f /im chromex.exe`);

    for (const sessionName of sessionNames) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionName }),
            puppeteer: {
                executablePath: 'C:/Program Files/Google/Chrome/Application/chromex.exe',
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014590669-alpha',
            }
        });

        client.on('qr', (qr) => {
            // qrcode.generate(qr, { small: true });
        });

        await new Promise((resolve) => {
            client.on('ready', async() => {
                sessions.push(client);
                resolve();
                const sessionInfo = sessionsInfo[sessionName];
                const sessionInfoMayus = sessionName.charAt(0).toUpperCase() + sessionName.slice(1);
                console.log(sessionColors[sessionName](`\n\nVendedora ${sessionInfoMayus} listo!`));
                notifier.notify({
                    title: 'MKTing Sessions 🎉',
                    message: `✅ Vendedora ${sessionInfoMayus} listo!`,
                    icon: './src/logo.png',

                });

                for (const groupId of sessionInfo.groupIds) {
                    await sendImagesAndText(client, sessionName, sessionInfoMayus, groupId);
                }

                // Mostrar mensaje de finalización de envíos para la sesión
                console.log('     ' + sessionColors[sessionName](`■■■---- ${sessionInfoMayus} finalizó todos los envíos.`));
                notifier.notify({
                    title: 'MKTing Terminamos 🎉',
                    message: `Se envio la difucion a los grupos de ${sessionInfoMayus} 🤩`,
                    icon: './src/logo.png',

                });
            });

            client.initialize();
        });
    }

    // Mostrar mensaje final de todos los clientes iniciados
    // console.log('     ■■■---- ' + colors.cyan(`${sessionNames.length} clientes iniciados!`));
    notifier.notify({
        title: 'MKTing Sessions 🎉',
        message: `${sessionNames.length} clientes iniciados! 🐼`,
        icon: './src/logo.png',

    });

    async function sendImagesAndText(client, sessionName, sessionInfoMayus, groupId) {
        exec(`start cmd.exe /k "node ${pScriptPath} --name ${sessionName}"`, { cwd: __dirname });
        const sessionInfo = sessionsInfo[sessionName];
        const totalImages = filesInfo[0].mns.length;
        const totalGroups = sessionInfo.groupIds.length;
        const mnsText = fs.readFileSync('app/grupos/mns.txt', 'utf-8');

        const groupInfo = await client.getChatById(groupId);
        const groupName = groupInfo.name;

        for (let i = 0; i < totalImages; i++) {
            console.log(`     ${sessionColors[sessionName](`└ ${sessionInfoMayus} - ${groupName}: F [${i + 1} de ${totalImages}] / G [${sessionInfo.groupIds.indexOf(groupId) + 1} de ${totalGroups}]`)}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            const media = MessageMedia.fromFilePath(filesInfo[0].mns[i]);
            await client.sendMessage(groupId, media);

            const tmpFilePath = path.resolve(__dirname,  `app/grupos/txt/${sessionName}.txt`);
            fs.writeFileSync(tmpFilePath, input + '\n');
            exec(`type ${tmpFilePath} | node ${pScriptPath}`, { cwd: __dirname });

        }

        console.log(`     ${sessionColors[sessionName](`└ ${sessionInfoMayus} - ${groupName}: Enviando Texto G [${sessionInfo.groupIds.indexOf(groupId) + 1} de ${totalGroups}]\n`)}`);
        await client.sendMessage(groupId, mnsText);

    }

}