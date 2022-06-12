const Document = require("../models/document")
const Mapper = require("../models/Mapper")
const User = require("../models/user")
const AppError = require("../utils/appError")
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

exports.shareDocument = catchAsync(async (req, res, next) => {
    const mapObj = await Mapper.findOne({ user: req.user._id, documentId: req.params.docId })
    // check if the user is the document owner or not
    if (!mapObj) return next(new AppError("You don't have access to this document", 401))
    if (mapObj.access !== "owner") {
        return next(new AppError("You don't have Enough permission to share this document", 401))
    }
    // take the email and find the user
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError("User not found. Please invite them", 404))
    }
    //check if already shared or not
    const mObj = await Mapper.findOne({ user: user._id, documentId: req.params.docId })

    if (mObj) return next(new AppError("Document already shared", 401))
    // if change of ownership tried
    if (req.body.access === "owner") return next(new AppError("Ownership can't be changed.", 401))
    // share it now
    const mapping = await Mapper.create({
        "documentId": req.params.docId,
        "user": user._id,
        "access": req.body.access
    })
    if (!mapping) {
        return next(new AppError("Not able to create mapping", 401))
    }
    res.status(201).json({
        status: "Success",
        mapping
    })
})

exports.changeName = catchAsync(async (req, res, next) => {
    const mapObj = await Mapper.findOne({ user: req.user._id, documentId: req.params.docId })
    // check if the user is the document owner or not
    if (!mapObj) return next(new AppError("You don't have access to this document", 401))
    if (mapObj.access !== "owner") {
        return next(new AppError("You don't have Enough permission to edit name for this document", 401))
    }
    const doc = await Document.findById(req.params.docId)
    if (!doc) return next(new AppError("Document not found", 404))
    doc.title = req.body.name
    await doc.save()
    res.status(201).json({
        status: "Success"
    })

})
