const { default: mongoose } = require("mongoose");

const docSchema = new mongoose.Schema({
    title: {
        type: String,
        default: "New Document"
    },
    data: {
        type: Object,
        required: false
    },

})

const Document = mongoose.model('Document', docSchema);
module.exports = Document;