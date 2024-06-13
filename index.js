/*
    version: 1.0.315 BETA
    creado: 6 de Junio del 2024
    desarrollador: Wichy Alonzo
*/

const fs = require('fs');
const { Client, LocalAuth, Location, MessageMedia, MessageAck } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer-core');
const readline = require('readline');
const colors = require('colors');

// Variables de mensajes
let espacioPreguntas = '    ';
let espacioPreguntasDos = '        ';
let mnsBienvenida = colors.yellow(`${espacioPreguntas}WhatsApp MK-Ultra 1.0.315 BETA
${espacioPreguntas}Envia mensajes de forma masiva a todos tus clientes de forma automatizada\n\n`);

// JSON, Arrays
const dataTipoCliente = JSON.parse(fs.readFileSync('app/files.json', 'utf8'));
const mnsCliente = {
    1: 'app/mns/leds.txt',
    2: 'app/mns/labis.txt',
    3: 'app/mns/mayoristas.txt',
    4: 'app/mns/departamentales.txt'
};
let opcionesCreada = [];



const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.1-beta.html', // Asegúrate de que esta URL sea válida
    }
});

client.on('qr', (qr) => {
    // Genera y escanea este código con tu teléfono
    qrcode.generate(qr, { small: true });
});

client.on('ready', async() => {
    async function askAsesor() {
        console.log(colors.blue(`${espacioPreguntas}Cliente listo!`));
        console.log(mnsBienvenida);

        try {
            console.log(colors.green(`${espacioPreguntas}>_ Obteniendo las Etiquetas espera un momento`));
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

            // Inicialmente, imprimimos el mensaje de selección de etiqueta
            console.log(`${espacioPreguntas}Introduce el número de la etiqueta seleccionada:`);

            // Luego, recorremos cada etiqueta y contamos los contactos asociados
            etiquetasMenu.forEach(label => {
                const contactosEtiquetados = contactos.filter(contacto =>
                    contacto.labels && contacto.labels.includes(label.id)
                );

                const contactosClientes = contactosEtiquetados.length;
                let mensajeEtiquetasClientes = '';
                if (contactosClientes >= 1) {
                    mensajeEtiquetasClientes = `${contactosClientes} contacto${contactosClientes > 1 ? 's' : ''}`;
                    console.log(colors.yellow(`   ${espacioPreguntas}${label.index}. ${label.name} (${mensajeEtiquetasClientes})`));
                }
            });

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const imprimirEtiquetas = () => {
                console.log(`${espacioPreguntas}Selecciona una etiqueta:`);
                etiquetasMenu.forEach(label => {
                    const contactosEtiquetados = contactos.filter(contacto =>
                        contacto.labels && contacto.labels.includes(label.id)
                    );
                    console.log(colors.yellow(`   ${espacioPreguntas}${label.index}. ${label.name} (${contactosEtiquetados.length} contactos)`));
                });
            }

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
                                    const ruta = obtenerRuta(opcion);
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
                                            // sendMessagesCompletSteps();
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
                                            const rutaMns = mnsCliente[opcion];
                                            const nuevoObjeto = {
                                                label: seleccion.name,
                                                mns: rutaMns,
                                                file: ruta,
                                                tipoCliente: nombreCliente
                                            };

                                            opcionesCreada.push(nuevoObjeto);
                                            fs.readFile(rutaMns, 'utf8', (err, data) => {
                                                if (err) {
                                                    console.error(err);
                                                    return;
                                                }

                                                const labelArray = opcionesCreada[0].label;
                                                const mnsArray = opcionesCreada[0].mns;
                                                const fileArray = opcionesCreada[0].file;
                                                const tipoClienteArray = opcionesCreada[0].tipoCliente;


                                                console.log(`
                ${colors.bgWhite.black('RESUMEN DE ENVIO')}
                - Clientes con Etiqueta: ${colors.yellow(labelArray)}
                ${fileArray.length > 0 ? '- Archivo: ' + colors.yellow(fileArray) + '' : '- Archivo: ' + colors.yellow('N/A') + ''}
                - Tipo de Clientes: ${colors.yellow(tipoClienteArray)}
                - Mensaje: ${colors.yellow(mnsArray)}
                                                    `);

                                                console.log(opcionesCreada);

                                                function mostrarAlert() {
                                                    rl.question(colors.yellow(`${espacioPreguntas}Estas seguro de enviar mensajes masivos ahora? (s/n): `), (opcion) => {
                                                        if (opcion === 's' || opcion === 'S') {
                                                            console.log(`\n    ${colors.bgYellow.black('>_ Enviando mensajes en 2s')}`);

                                                            // Archivos multimedia
                                                            const extension = fileArray.split('.').pop();
                                                            if (fileArray === '' || fileArray === ' ') {
                                                                console.log('Se Enviara Texto');
                                                            } else {
                                                                if (extension === 'png' || extension === 'jpg') {
                                                                    console.log('Se Enviara Texto e Imagen');

                                                                } else if (extension === 'mp3') {
                                                                    console.log('Se Enviara Texto y Audio');

                                                                } else if (extension === 'pdf') {
                                                                    console.log('Se Enviara Texto y PDF');

                                                                }
                                                            }
                                                            console.log(`       Enviaremos mensajes a clientes con la etiqueta ${colors.green(seleccion.name)}`);
                                                            const primerosTresNumeros = contactosEtiquetados.slice(0, numeroMensajes);
                                                            for (let i = 0; i < primerosTresNumeros.length; i++) {
                                                                setTimeout(async() => {
                                                                    // console.log(`          ${contacto.pushname || contacto.number}: ${contacto.number}`);
                                                                    await new Promise((done) => setTimeout(done, 2000));
                                                                    let numeroForCliente = `${contactosEtiquetados[i].number}@c.us`;
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
                                                                                console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));

                                                                            })
                                                                            .catch((error) => {
                                                                                console.log(colors.red(`                 └ ×  Mensaje Enviado ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));

                                                                            });
                                                                    } else {
                                                                        if (extension === 'png' || extension === 'jpg') {
                                                                            client.sendMessage(numeroForCliente, mediMessage, {
                                                                                    caption: data
                                                                                })
                                                                                .then(() => {
                                                                                    console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));

                                                                                })
                                                                                .catch((error) => {
                                                                                    console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));

                                                                                });


                                                                        } else if (extension === 'mp3') {
                                                                            client.sendMessage(numeroCorregido, mediMessage, {
                                                                                    caption: captions
                                                                                })
                                                                                .then(() => {
                                                                                    console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));

                                                                                })
                                                                                .catch((error) => {
                                                                                    console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));

                                                                                });

                                                                            // Texto
                                                                            client.sendMessage(numeroCorregido, data)
                                                                                .then(() => {
                                                                                    console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));

                                                                                })
                                                                                .catch((error) => {
                                                                                    console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));
                                                                                });

                                                                        } else if (extension === 'pdf') {
                                                                            client.sendMessage(numeroForCliente, mediMessage, {
                                                                                    caption: captions
                                                                                })
                                                                                .then(() => {
                                                                                    console.log(colors.green(`                 └ ✔  Mensaje Enviado a ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));

                                                                                })
                                                                                .catch((error) => {
                                                                                    console.log(colors.red(`                 └ ×  Mensaje No Enviado a ${numeroForCliente} Mensajes (${i + 1} de ${numeroMensajes})`));

                                                                                });
                                                                        }
                                                                    }
                                                                }, i * 20000);
                                                            }
                                                        } else if (opcion === 'n' || opcion === 'N') {
                                                            opcionesCreada = [];
                                                            askAsesor();

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
                            console.log('No hay contactos etiquetados con esta etiqueta.');

                        }
                    } else {
                        console.log(colors.red(`    >_ Selección inválida.`));
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

    askAsesor();
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();