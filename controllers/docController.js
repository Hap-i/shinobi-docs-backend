const Document = require("../models/document")
const Mapper = require("../models/Mapper")
const { catchAsync } = require("../utils/catchAsync")

exports.createNewDocument = catchAsync(async (req, res, next) => {
    const document = await Document.create({
        "data": req.body.data
    })
    const mapping = await Mapper.create({
        "documentId": document._id,
        "user": req.user,
        "access": "owner"

    })
    res.status(201).json({
        status: "Success",
        data: {
            "title": document.title,
            "id": document._id

        }
    })
})

exports.getAllDocuments = catchAsync(async (req, res, next) => {
    const documents = await Mapper.find({ user: req.user._id }).populate('documentId', 'title')
    res.status(201).json({
        status: "Success",
        data: {
            documents

        }
    })
})

