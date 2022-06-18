const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './.env.development.local' })

const app = require('./app')
const Document = require('./models/document')

// const io = new Server(server);

const DB = process.env.DATABASE
mongoose.connect(DB, {})
    .then((result) => console.log("DB connection Successful!"))
    .catch((err) => console.log(err))

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
    console.log(`App is runnig on port ${port}...`)
})

const io = require("socket.io")(server, { cors: { origin: "http://localhost:3000" } });
io.on('connection', (socket) => {
    socket.on('get-documnet', async documentId => {
        // console.log("get-document called and id is : ", documentId);
        const document = await findDocument(documentId)
        socket.join(documentId)
        // console.log("data to send: " + JSON.stringify(document.data))
        socket.emit("load-document", document.data)
        socket.on("send-changes", delta => {
            // console.log(delta);
            socket.broadcast.to(documentId).emit("receive-changes", delta)
        })
        socket.on("doc-save", async data => {
            // console.log(data);
            await Document.findByIdAndUpdate(documentId, { data })
        })

    })
})

async function findDocument(id) {
    if (id === null) return
    const document = await Document.findById(id)
    if (document) return document
    return
}