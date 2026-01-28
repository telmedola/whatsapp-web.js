/**
 * ==== wwebjs-shell ====
 * Used for quickly testing library features
 * 
 * Running `npm run shell` will start WhatsApp Web with headless=false
 * and then drop you into Node REPL with `client` in its context. 
 */

const repl = require('repl');

const { Client, LocalAuth } = require('./index');

console.log('Initializing...');

//1 ou 0
const INTERFACE_GUI = 0;
//MAC
//const LOCAL_BROWSER = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
//LINUX
const LOCAL_BROWSER = '/usr/bin/google-chrome-stable';

let puppOpt;

if (INTERFACE_GUI == 0) {
    puppOpt = {
        headless: false,
        restartOnAuthFail: true,
        takeoverOnConflict: true,
        qrMaxRetries: 5,
        executablePath: LOCAL_BROWSER,
        args: ['--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            //novos parâmetros
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-infobars',
            '--disable-gpu',
            '--disable-backgrounding-occluded-windows',
            //'--user-agent=WhatsAppBot/1.0 (Linux; Android 10) Chrome/108.0.0.0 Mobile Safari/537.36'
        ]
        //,'--user-data-dir=/app/tmp/chromium']
    };
} else {
    puppOpt = {
        headless: true,
        executablePath: LOCAL_BROWSER,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
}
const localAuth = {
    clientId: '123456',
    dataPath: './session'
};
const client = new Client(
    {
        puppeteer: puppOpt,
        authStrategy: new LocalAuth(localAuth),
        authTimeoutMs: 0,
    }
);

client.initialize();

client.on('qr', async (qr) => {
    console.log('Please scan the QR code on the browser.');

    // Gerar imagem do QR code usando uma nova página no Puppeteer
    try {
        const browser = client.pupBrowser;
        const page = await browser.newPage();
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`;
        await page.goto(qrUrl);
        await page.screenshot({ path: 'qr_code.png', fullPage: false });
        await page.close();
        console.log('QR code image saved as qr_code.png');
    } catch (error) {
        console.error('Error generating QR code image:', error);
    }
});

client.on('authenticated', (session) => {
    console.log(JSON.stringify(session));
});

client.on('ready', async () => {
    console.log('Client is ready! You can now use the "client" object in the REPL.');
    const chats = await client.getChats();
    debugger;
    try {
        const registered = await client.getChatById('554188433383@c.us');
        //console.log("registered: ", registered);
        const contact = await client.getContactLidAndPhone('5541991519121@c.us');
        console.log("contact: ", contact[0]);
        if (contact && contact.length > 0) {
            //console.log("Looking for LID...");
            //const lid = await client.getLid('5541991519121@c.us');
            //console.log("LID result:", lid);

            if (contact[0].lid) {
                await client.sendMessage(contact[0].lid, "ok - com lid");
            } else {
                console.log("chat: ", await client.getChatById(contact[0].pn));
                await client.sendMessage(contact[0].pn, "ok - sem lid");
            }
        } else {
            await client.sendMessage('5541991519121@c.us', "ok - sem lid");
        }
    } catch (err) {
        console.error('Error sending message:', err);
    }


    console.log("chats:", chats.length);
});

/*client.on('ready', () => {
    const shell = repl.start('wwebjs> ');
    shell.context.client = client;
    shell.on('exit', async () => {
        await client.destroy();
    });
});
*/
