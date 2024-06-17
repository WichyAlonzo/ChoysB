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
const dataTipoCliente = JSON.parse(fs.readFileSync('app/files.json', 'utf8'));
const gruposPath = 'app/mkting/grupos.json';
const mensaje = fs.readFileSync('app/mkting/mnsG.txt', 'utf8');
const imagenes = JSON.parse(fs.readFileSync('app/mkting/img.json', 'utf8'));
const mnsCliente = {
    1: 'app/mns/leds.txt',
    2: 'app/mns/labis.txt',
    3: 'app/mns/mayoristas.txt',
    4: 'app/mns/departamentales.txt'
};
let opcionesCreada = [];
const db = new sqlite3.Database('app/db.db');

// Rutas
const chromeExePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chromexExePath = 'C:/Program Files/Google/Chrome/Application/chromex.exe';


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
        inciarClient();

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
        inciarClient();
    }
}
/*
    Funciona bien (16-Junio-2024)
    2.2413.51-beta.html

    Funciona bien (17-Junio-2024)
    2.2412.1-beta.html
*/
// 2.2413.51-beta.html
function inciarClient() {
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            executablePath: 'C:/Program Files/Google/Chrome/Application/chromex.exe',
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51-beta.html',
        }
    });

    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });

    });

    client.on('ready', async() => {
        async function insertarRegistro(numeroLimpio, tipo, fecha, send, label) {
            await db.run(`INSERT INTO clientes (numeroLimpio, tipo, fecha, send, etiqueta) VALUES (?, ?, ?, ?, ?)`, numeroLimpio, tipo, fecha, send, label);
        }


        async function askAsesor() {
            console.log(colors.blue(`${espacioPreguntas}Cliente listo!`));
            console.log(mnsBienvenida);

            // Seccion Marketings
            async function selectGroupsMkting() {
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
                        await delayWithCountdown(30000);
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

                    const readlineGrupos = require('readline').createInterface({
                        input: process.stdin,
                        output: process.stdout
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

                async function enviarMnsGrupos() {
                    const grupos = JSON.parse(fs.readFileSync(gruposPath, 'utf8'));
                    for (let grupo of grupos) {
                        const chat = await client.getChatById(grupo);
                        const nombreGrupo = chat.name;
                        console.log(colors.yellow(`\n\n${espacioPreguntas}   Grupo: ${nombreGrupo}`));
                        for (let imagen of imagenes) {
                            console.log(`${espacioPreguntas}      ■ Imagen enviada: ` + colors.blue(`${imagen}`));
                            const media = MessageMedia.fromFilePath(imagen);
                            await client.sendMessage(grupo, media);
                            await delayWithCountdown(2000); // Esperar 8 segundos entre cada imagen
                        }

                        console.log(`${espacioPreguntas}      ■ Mensaje enviado: ` + colors.blue(`${mensaje}\n\n`));
                        await client.sendMessage(grupo, mensaje);
                        await delayWithCountdown(8000); // Esperar 20 segundos antes de pasar al siguiente grupo

                    }
                    notifier.notify({
                        title: 'Terminamos 🎉',
                        message: `Se enviarlos las imagenes y mensaje a los grupos 🤩`,
                        icon: './src/logo.png',

                    });
                    console.log(`${espacioPreguntas}   ` + colors.bgYellow.black(` Terminamos :3 ¡Ya puedes cerrar el navegador! `));

                }

                // Función de ayuda para esperar con cuenta regresiva
                async function delayWithCountdown(ms) {
                    for (let i = ms / 1000; i > 0; i--) {
                        process.stdout.write(`    ${espacioPreguntas}      ` + colors.bgMagenta.white(`Esperando ${i}...  \r`));
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    process.stdout.write('\n');
                }

                validateAndCountGrupos();
                // enviarMnsGrupos();


            }

            // Seccion Asesoras
            async function asesorVentas() {
                console.log('Ventas iniciado...');
                try {
                    console.log(colors.green(`${espacioPreguntas}>_ Obteniendo las Etiquetas, espera un momento`));
                    console.clear();
                    console.log(colors.blue(`${espacioPreguntas}Cliente listo!`));
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
                        const fechaActualComparacion = new Date().toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            weekday: 'long',
                        });

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
                                                // db.get(`SELECT * FROM clientes WHERE numeroLimpio = ?`, numerClienteArray, (err, row) => {
                                                //     if (err) {
                                                //         reject(err);
                                                //     } else {
                                                //         resolve(row);
                                                //     }
                                                // });
                                            });

                                            if (row) {
                                                const fechaLibre = row.fecha;
                                                const fechaRow = fechaLibre.split(', ').slice(0, 2).join(', ');

                                                if (fechaRow === fechaActualComparacion) {
                                                    // console.log(item);

                                                } else {
                                                    console.log(`${item} esta en la base pero no tiene la fecha\nFECHA AHORA: ${fechaActualComparacion}\nFecha de Row: ${fechaRow}`);
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

                                            } else if (contactosClientesDuplicados === 0) {
                                                console.log(colors.red(`   ${espacioPreguntas}${label.index}. ${label.name} ${colors.bgRed.white('(Sin Contactos)')}`));


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

                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });


                    const preguntarEtiqueta = async() => {
                        rl.question(`${espacioPreguntas}Introduce el número de la etiqueta seleccionada: `, async(respuesta) => {
                            const seleccion = etiquetasMenu.find(label => label.index == respuesta);
                            if (seleccion) {
                                console.log(`    > Has seleccionado la etiqueta: ${colors.green(seleccion.name)}`);
                                const contactosEtiquetados = contactos.filter(contacto =>
                                    contacto.labels && contacto.labels.includes(seleccion.id)
                                );
                                if (contactosEtiquetados.length > 0) {
                                    function mostrarMenu() {
                                        console.log(`${espacioPreguntas}Tipo de clientes?`);
                                        console.log(colors.yellow(`   ${espacioPreguntas}1. Leads`));
                                        console.log(colors.yellow(`   ${espacioPreguntas}2. Labis`));
                                        console.log(colors.yellow(`   ${espacioPreguntas}3. Boutique / Mayoristas`));
                                        console.log(colors.yellow(`   ${espacioPreguntas}4. Departamentales`));
                                        rl.question(`${espacioPreguntas}Seleccione una opción (1-4): `, (opcion) => {
                                            let ruta = obtenerRuta(opcion);
                                            let nombreCliente = '';
                                            if (opcion === '1') {
                                                nombreCliente = 'Leads';

                                            } else if (opcion === '2') {
                                                nombreCliente = 'Labis';

                                            } else if (opcion === '3') {
                                                nombreCliente = 'Boutique / Mayoristas';

                                            } else if (opcion === '4') {
                                                nombreCliente = 'Departamentales';

                                            }

                                            if (opcion) {
                                                console.log(`    > Has seleccionado: ${colors.green(nombreCliente)}`);

                                                // Preguntar la cantidad de mensajes que queremos enviar
                                                let numeroClientesEtiqueta = contactosEtiquetados.length;
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


                                                function askMensajes() {
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
                                                    let rutaMns = mnsCliente[opcion];
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

                                                                    // Archivos multimedia
                                                                    const extension = fileArray.split('.').pop();
                                                                    if (fileArray === '' || fileArray === ' ') {
                                                                        console.log(`    ${colors.bgYellow.black('Se Enviara Texto')}`);
                                                                    } else {
                                                                        if (extension === 'png' || extension === 'jpg') {
                                                                            console.log(`    ${colors.bgYellow.black('Se Enviara Texto e Imagen')}`);

                                                                        } else if (extension === 'mp3') {
                                                                            console.log(`    ${colors.bgYellow.black('Se Enviara Texto y Audio')}`);

                                                                        } else if (extension === 'pdf') {
                                                                            console.log(`    ${colors.bgYellow.black('Se Enviara Texto y PDF')}`);

                                                                        }
                                                                    }
                                                                    console.log(`       Enviaremos mensajes a clientes con la etiqueta ${colors.green(seleccion.name)}`);
                                                                    const primerosTresNumeros = contactosEtiquetados.slice(0, numeroMensajes);
                                                                    let conteo = 0;
                                                                    for (let i = 0; i < primerosTresNumeros.length; i++) {
                                                                        const fechaActual = new Date().toLocaleString('es-ES', {
                                                                            hour: 'numeric',
                                                                            minute: 'numeric',
                                                                            hour12: true,
                                                                            day: 'numeric',
                                                                            month: 'long',
                                                                            year: 'numeric',
                                                                            weekday: 'long',
                                                                        });

                                                                        setTimeout(async() => {
                                                                            // console.log(`          ${contacto.pushname || contacto.number}: ${contacto.number}`);
                                                                            await new Promise((done) => setTimeout(done, 2000));
                                                                            let numeroForCliente = `${contactosEtiquetados[i].number}@c.us`;
                                                                            let numeroForClienteLibre = contactosEtiquetados[i].number;
                                                                            let mediMessage;
                                                                            if (fileArray === '' || fileArray === ' ') {
                                                                                mediMessage = '';

                                                                            } else {
                                                                                mediMessage = MessageMedia.fromFilePath(fileArray);

                                                                            }


                                                                            // Texto
                                                                            if (fileArray === '' || fileArray === ' ') {
                                                                                client.sendMessage(numeroForCliente, data)
                                                                                    .then(() => {
                                                                                        console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                        insertarRegistro(numeroForClienteLibre, 'Texto', fechaActual, true, labelArray);

                                                                                    })
                                                                                    .catch((error) => {
                                                                                        console.log(colors.red(`                 └ ×  Mensaje Enviado ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                        insertarRegistro(numeroForClienteLibre, 'Texto', fechaActual, false, labelArray);

                                                                                    });
                                                                            } else {
                                                                                if (extension === 'png' || extension === 'jpg') {
                                                                                    client.sendMessage(numeroForCliente, mediMessage, {
                                                                                            caption: data
                                                                                        })
                                                                                        .then(() => {
                                                                                            console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                            insertarRegistro(numeroForClienteLibre, 'Texto/Imagen', fechaActual, true, labelArray);

                                                                                        })
                                                                                        .catch((error) => {
                                                                                            console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                            insertarRegistro(numeroForClienteLibre, 'Texto/Imagen', fechaActual, false, labelArray);

                                                                                        });


                                                                                } else if (extension === 'mp3') {
                                                                                    client.sendMessage(numeroCorregido, mediMessage, {
                                                                                            caption: captions
                                                                                        })
                                                                                        .then(() => {
                                                                                            console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                            insertarRegistro(numeroForClienteLibre, 'Audio', fechaActual, true, labelArray);

                                                                                        })
                                                                                        .catch((error) => {
                                                                                            console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                            insertarRegistro(numeroForClienteLibre, 'Audio', fechaActual, false, labelArray);

                                                                                        });

                                                                                    // Texto
                                                                                    client.sendMessage(numeroCorregido, data)
                                                                                        .then(() => {
                                                                                            console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                            insertarRegistro(numeroForClienteLibre, 'Texto', fechaActual, true, labelArray);

                                                                                        })
                                                                                        .catch((error) => {
                                                                                            console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                            insertarRegistro(numeroForClienteLibre, 'Texto', fechaActual, false, labelArray);
                                                                                        });

                                                                                } else if (extension === 'pdf') {
                                                                                    client.sendMessage(numeroForCliente, mediMessage, {
                                                                                            caption: captions
                                                                                        })
                                                                                        .then(() => {
                                                                                            console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                            insertarRegistro(numeroForClienteLibre, 'Texto/PDF', fechaActual, true, labelArray);

                                                                                        })
                                                                                        .catch((error) => {
                                                                                            console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroForClienteLibre} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                            insertarRegistro(numeroForClienteLibre, 'Texto/PDF', fechaActual, false, labelArray);

                                                                                        });
                                                                                }
                                                                            }
                                                                            conteo++;
                                                                            await new Promise((done) => setTimeout(done, 2000));
                                                                            if (conteo === primerosTresNumeros.length) {
                                                                                console.log('Terminamos');
                                                                                notifier.notify({
                                                                                    title: 'Terminamos 🎉',
                                                                                    message: `Se enviarlos las imagenes y mensaje los clientes con etiqueta ${labelArray}`,
                                                                                    icon: './src/logo.png',

                                                                                });
                                                                                rl.close();
                                                                                await asesorVentas();
                                                                            }

                                                                        }, i * 20000);
                                                                    }



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
                                                        // console.log(data);
                                                    });

                                                }
                                            } else {
                                                console.log(colors.red('    >_ Selección inválida.'));
                                                mostrarMenu();
                                            }
                                        });
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

                                }
                            } else {
                                console.log(colors.red(`    >_ Selección inválida.`));
                                rl.close();
                                preguntarEtiqueta();

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

            /* 
                -> Funciones para el Manejo de Finanzas 
                -> Funciones para el Manejo de Finanzas 
                -> Funciones para el Manejo de Finanzas 
                    ► readExcelFile(filePath)
                        Lee el archivo Excel para luego convertirlo en Array o obtener la informcacion
                    
                    ► readTextFile(filePath)
                        Lee el archivo donde se encuentra el Mensaje que se le enviara, junto con las
                        variables del mensaje

                    ► convertirNumeroALetras(numero)
                        Pasa los numeros a Texto y se crea la regla para los *Mil*

                    ► convertirFechaExcel(fechaExcel)
                        Convierte la fecha que esta en la hoja de Excel se controla el error que manda
                        solo numeros y no la fecha

                    ► replacePlaceholders(message, user, pay, date) 
                        Remplazamos variables del mensaje por la informacion del Cliente

            */
            function readExcelFile(filePath) {
                const workbook = xlsx.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
                const rows = [];
                for (let i = 1; i < data.length; i++) {
                    const row = data[i];
                    const nombre = row[0];
                    const fechaCorte = row[1];
                    const cantidad = row[2];
                    const pago = row[3];
                    const numero = row[4];

                    if (pago === 'false') {
                        rows.push({
                            Nombre: nombre,
                            FechaCorte: fechaCorte,
                            Cantidad: cantidad,
                            Pago: pago,
                            Numero: numero
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

            function replacePlaceholders(message, user, pay, date) {
                const formattedPay = pay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const payInWords = convertirNumeroALetras(pay);
                return message
                    .replace('%user%', `*${user}*`)
                    .replace('%pay%', `*$${formattedPay} MXN (${payInWords})*`)
                    .replace('%date%', `*${date}*`);

            }

            function ventasModulo() {
                const excelFilePath = 'app/finanzas/finanzas.xlsx';
                const textFilePath = 'app/finanzas/mns.txt';

                try {
                    const rows = readExcelFile(excelFilePath);
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

                                    const fechaCorte = convertirFechaExcel(dupRow.FechaCorte);
                                    const personalizedMessage = replacePlaceholders(
                                        messageTemplate,
                                        dupRow.Nombre,
                                        dupRow.Cantidad,
                                        fechaCorte
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
                            });

                        }

                    }

                    // Llamar a la función principal
                    processRows(rows).then(() => {
                        // No code 

                    });
                } catch (error) {
                    console.error('Error:', error);
                }
            }

            function main() {
                const settingsPath = path.join(__dirname, 'app/settings.json');
                fs.readFile(settingsPath, 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error leyendo el archivo:', err);
                        return;
                    }

                    const settings = JSON.parse(data);
                    const { selectGroups, ventas, finanzas } = settings[0];

                    // Mkting
                    if (selectGroups) {
                        console.log(colors.green(`${espacioPreguntas}Mkting iniciado...`));
                        selectGroupsMkting();

                    }

                    // Ventas
                    if (ventas) {
                        console.log(colors.green(`${espacioPreguntas}Asesor de ventas iniciado...`));
                        asesorVentas();

                    }

                    // Finanzas
                    if (finanzas) {
                        console.log(colors.green(`${espacioPreguntas}Asesor de ventas iniciado...`));
                        ventasModulo();

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


// Función para limpiar el proceso de Puppeteer y los procesos de Chrome asociados
async function cleanUpProcesses() {
    try {
        await exec(`taskkill /f /im chromex.exe`);

    } catch (error) {
        console.error('Error cleaning up processes:', error);

    } finally {
        process.exit(); // Salir del proceso Node.js después de limpiar

    }
}

// Manejadores de señales para limpiar procesos antes de salir
process.on('SIGINT', async() => {
    console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
    await cleanUpProcesses();

});

process.on('SIGTERM', async() => {
    console.log(colors.cyan(`${espacioPreguntas}           Se limpio el programa ;)`));
    await cleanUpProcesses();

});