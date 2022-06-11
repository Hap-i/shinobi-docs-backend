const { default: mongoose } = require("mongoose");

const mapperSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: [true, 'Document is required to map to a user']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required to map to a Document']
    },
    access: {
        type: String,
        required: [true, 'A access type is required for mapper'],
        enum: {
            values: ['owner', 'editor', 'viewer'],
            message: 'Access type is either: owner, editor or viewer'
        }
    }
})

const Mapper = mongoose.model('Mapper', mapperSchema);
module.exports = Mapper;