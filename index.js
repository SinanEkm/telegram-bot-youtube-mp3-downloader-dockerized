process.env["NTBA_FIX_350"] = 1;
process.env["NTBA_FIX_319"] = 1;
const express = require('express');
const ytdl = require('ytdl-core');
const fs = require('fs');
const { response } = require('express');
const TelegramBot = require('node-telegram-bot-api');
const request = require('request');

const app = express();

const TOKEN = "TELEGRAM_TOKEN";
const url = 'BOT_URL';

const bot = new TelegramBot(TOKEN);

bot.setWebHook('WEBHOOK_URL');

app.use(express.json());

app.get('/', (req, res) => res.send(''));

//e.g bot[TELEGRAM_TOKEN] --> bot11112222333544
app.post('/bot[TELEGRAM_TOKEN]', (req, res) => {    
    bot.processUpdate(req.body);
    res.sendStatus(200);
})

var requestedUrl;

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log("My rest api is working on port "+PORT);
});

async function gettheytdl(requestedUrl) {
    
    var getinfo = await ytdl.getBasicInfo(requestedUrl);
    
    var title = getinfo.videoDetails.title;
    console.log("The title of the song: " + title);
    for(var i = 0; i < getinfo.formats.length; i++){
        var formatSpecs = getinfo.formats[i];
        console.log(formatSpecs.itag + "-" + formatSpecs.mimeType + "-" + formatSpecs.audioQuality);
    }
    return getinfo;
}
app.get('/download',(req, res) => {
    var videoCode = req.query.v;
    var destDir = req.query.destDir; 
    var url = "https://www.youtube.com/watch?v="+videoCode;
    console.log(url);
    gettheytdl(url).then(response => {
        var title = response.videoDetails.title;
        res.set({
            'Content-Disposition': 'attachment; filename=' + Cevir(title)+'.mp3',
            'Content-Type':'audio/mpeg'
            // 'Access-Control-Allow-Origin':'*'
        })        
        ytdl(url, { quality: '140' }).pipe(res);
    });
});
function Cevir(text) {
    var trMap = {
        'çÇ': 'c',
        'ğĞ': 'g',
        'şŞ': 's',
        'üÜ': 'u',
        'ıİ': 'i',
        'öÖ': 'o'
    };
    for (var key in trMap) {
        text = text.replace(new RegExp('[' + key + ']', 'g'), trMap[key]);
    }
    return text.replace(/[^-a-zA-Z0-9\s]+/ig, '')
        .replace(/\s/gi, "-")
        .replace(/[-]+/gi, "-")
        .toLowerCase();
}

bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

bot.on('message', (msg) => {
    
    const chatId = msg.chat.id;
    
    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, 'Received your message');
    if (ytdl.validateURL(msg.text)) {
        var url = msg.text;
        gettheytdl(url).then(response => {
            var title = response.videoDetails.title.toUpperCase();
            bot.sendMessage(chatId, title + " | Will be downloaded");
            ytdl(url, { quality: '140' }).pipe(fs.createWriteStream("tempDownloads/" + Cevir(title) + ".mp3")).on('finish', () => {
                var directory = __dirname + "/tempDownloads/" + Cevir(title) + ".mp3";
                const stream = fs.createReadStream(directory);
                bot.sendAudio(chatId, stream).then((response) => {
                    console.log(response);
                    fs.unlinkSync(directory);
                    console.log("COMPLETED");
                });
            });
            const fileOption = {
                filename: Cevir(title) + ".mp3",
                contentType: 'audio/mpeg'
            };
        });
    } else {
        bot.sendMessage(chatId, "Link is not valid!");
    }
});